import http from 'node:http';
import {
  createEnvelope,
  extractContext,
  contextStorage,
} from '@mevis/platform-communication';

const PORT = parseInt(process.env['PORT'] || '8000', 10);

interface ServiceInstance {
  name: string;
  version: string;
  endpoint: string;
  lastHeartbeat: number;
}

// In-memory catalog
const serviceCatalog = new Map<string, ServiceInstance[]>();

// Housekeeping: purge dead instances every 10 seconds
setInterval(() => {
  const now = Date.now();
  const timeoutMs = 30000; // 30s timeout

  for (const [name, instances] of serviceCatalog.entries()) {
    const active = instances.filter((inst) => now - inst.lastHeartbeat < timeoutMs);
    if (active.length === 0) {
      serviceCatalog.delete(name);
      process.stdout.write(
        JSON.stringify({
          level: 'info',
          service: 'gateway',
          event: 'service_purged',
          serviceName: name,
          timestamp: new Date().toISOString(),
        }) + '\n',
      );
    } else if (active.length !== instances.length) {
      serviceCatalog.set(name, active);
    }
  }
}, 10000).unref();

function json(res: http.ServerResponse, status: number, payload: object): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'X-Service': 'gateway',
  });
  res.end(body);
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch {
        reject(new Error('Invalid JSON payload.'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const ctx = extractContext(req);

  // Run routing inside context Storage so standard responses carry correct metadata
  await contextStorage.run(ctx, async () => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const segments = url.pathname.split('/').filter(Boolean);

    try {
      // 1. Service Registration endpoint
      if (req.method === 'POST' && url.pathname === '/api/registry/register') {
        const body = (await readJson(req)) as { name: string; version: string; endpoint: string };
        if (!body.name || !body.endpoint) {
          return json(
            res,
            400,
            createEnvelope(
              false,
              undefined,
              [{ code: 'INVALID_BODY', message: 'Missing service name or endpoint.' }],
              'gateway',
            ),
          );
        }

        let list = serviceCatalog.get(body.name) || [];
        // Dedup instance
        list = list.filter((inst) => inst.endpoint !== body.endpoint);
        list.push({
          name: body.name,
          version: body.version || '1.0.0',
          endpoint: body.endpoint,
          lastHeartbeat: Date.now(),
        });
        serviceCatalog.set(body.name, list);

        return json(res, 200, createEnvelope(true, { registered: true }, undefined, 'gateway'));
      }

      // 2. Service Deregistration endpoint
      if (req.method === 'POST' && url.pathname === '/api/registry/deregister') {
        const body = (await readJson(req)) as { name: string; endpoint: string };
        if (body.name && body.endpoint) {
          const list = serviceCatalog.get(body.name) || [];
          const filtered = list.filter((inst) => inst.endpoint !== body.endpoint);
          if (filtered.length === 0) {
            serviceCatalog.delete(body.name);
          } else {
            serviceCatalog.set(body.name, filtered);
          }
        }
        return json(res, 200, createEnvelope(true, { deregistered: true }, undefined, 'gateway'));
      }

      // 3. Service Resolution endpoint
      if (
        req.method === 'GET' &&
        segments[0] === 'api' &&
        segments[1] === 'registry' &&
        segments[2] === 'resolve' &&
        segments[3]
      ) {
        const name = segments[3];
        const instances = serviceCatalog.get(name);
        if (!instances || instances.length === 0) {
          return json(
            res,
            404,
            createEnvelope(
              false,
              undefined,
              [{ code: 'SERVICE_NOT_FOUND', message: `Service "${name}" is not registered.` }],
              'gateway',
            ),
          );
        }
        // Round robin load balance
        const instance = instances[Math.floor(Math.random() * instances.length)];
        return json(
          res,
          200,
          createEnvelope(true, { endpoint: instance!.endpoint }, undefined, 'gateway'),
        );
      }

      // 4. Reverse Proxy Endpoint routing
      // Expected pattern: /api/gateway/services/:serviceName/*
      if (
        segments[0] === 'api' &&
        segments[1] === 'gateway' &&
        segments[2] === 'services' &&
        segments[3]
      ) {
        const name = segments[3];
        const instances = serviceCatalog.get(name);
        if (!instances || instances.length === 0) {
          return json(
            res,
            502,
            createEnvelope(
              false,
              undefined,
              [{ code: 'BAD_GATEWAY', message: `No active instances of "${name}" resolved.` }],
              'gateway',
            ),
          );
        }

        const instance = instances[Math.floor(Math.random() * instances.length)];
        const targetPath = '/' + segments.slice(4).join('/') + url.search;

        const proxyHeaders: Record<string, string> = {};
        for (const [key, val] of Object.entries(req.headers)) {
          if (val !== undefined) {
            proxyHeaders[key] = Array.isArray(val) ? val.join(', ') : val;
          }
        }
        proxyHeaders['x-request-id'] = ctx.requestId;
        proxyHeaders['x-correlation-id'] = ctx.correlationId;
        if (ctx.actorId) proxyHeaders['x-actor-id'] = ctx.actorId;
        if (ctx.actorRole) proxyHeaders['x-actor-role'] = ctx.actorRole;

        const targetUrl = new URL(targetPath, instance!.endpoint);

        // Fetch forward request
        const response = await fetch(targetUrl.toString(), {
          method: req.method,
          headers: proxyHeaders,
          body: req.method !== 'GET' && req.method !== 'HEAD' ? await readBody(req) : undefined,
        });

        const respHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          respHeaders[key] = val;
        });

        res.writeHead(response.status, respHeaders);
        const arrayBuffer = await response.arrayBuffer();
        return res.end(Buffer.from(arrayBuffer));
      }

      // 5. Gateway Health check
      if (req.method === 'GET' && url.pathname === '/api/health') {
        const services: Record<string, number> = {};
        for (const [name, inst] of serviceCatalog.entries()) {
          services[name] = inst.length;
        }
        return json(
          res,
          200,
          createEnvelope(true, { status: 'UP', serviceCatalog: services }, undefined, 'gateway'),
        );
      }

      json(
        res,
        404,
        createEnvelope(false, undefined, [{ code: 'NOT_FOUND', message: 'Not found.' }], 'gateway'),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error.';
      json(
        res,
        500,
        createEnvelope(false, undefined, [{ code: 'INTERNAL_SERVER_ERROR', message }], 'gateway'),
      );
    }
  });
});

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      service: 'gateway',
      event: 'server_started',
      port: PORT,
      timestamp: new Date().toISOString(),
    }) + '\n',
  );
});

export default server;
