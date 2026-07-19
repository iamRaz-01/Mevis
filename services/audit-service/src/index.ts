import http from 'node:http';
import { loadServiceConfig } from '@mevis/infrastructure-configuration';
import {
  StdoutAuditAdapter,
  type AuditPort,
  type AuditEmitRequest,
} from '@mevis/infrastructure-auditing';

const config = loadServiceConfig('audit-service');
const PORT = config.port;

// In-memory ring buffer for serving GET /api/audit-events without a database.
// In production this would be backed by a persistent store (PostgreSQL, BigQuery, etc.).
const eventLog: object[] = [];
const MAX_EVENTS = 1000;

const auditAdapter: AuditPort = new StdoutAuditAdapter();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

function json<T>(res: http.ServerResponse, status: number, body: ApiResponse<T>): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-Service': 'audit-service',
  });
  res.end(payload);
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const ts = new Date().toISOString();

  try {
    // POST /api/audit-events — record an audit event
    if (req.method === 'POST' && url.pathname === '/api/audit-events') {
      const body = (await readJson(req)) as AuditEmitRequest;

      if (!body.actorId || !body.action || !body.outcome) {
        return json(res, 400, {
          success: false,
          error: 'Missing required fields: actorId, action, outcome.',
          timestamp: ts,
        });
      }

      const event = await auditAdapter.emit(body);

      // Buffer for local retrieval
      if (eventLog.length >= MAX_EVENTS) eventLog.shift();
      eventLog.push(event);

      return json(res, 201, { success: true, data: event, timestamp: ts });
    }

    // GET /api/audit-events — retrieve recent events (newest first)
    if (req.method === 'GET' && url.pathname === '/api/audit-events') {
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50;
      const recent = [...eventLog].reverse().slice(0, limit);
      return json(res, 200, {
        success: true,
        data: { events: recent, total: eventLog.length },
        timestamp: ts,
      });
    }

    // GET /api/health
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, {
        success: true,
        data: { status: 'UP', service: 'audit-service', bufferedEvents: eventLog.length },
        timestamp: ts,
      });
    }

    json(res, 404, { success: false, error: 'Not found.', timestamp: ts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    json(res, 500, { success: false, error: message, timestamp: ts });
  }
});

server.listen(PORT, () => {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      service: 'audit-service',
      event: 'server_started',
      port: PORT,
      environment: config.environment,
      timestamp: new Date().toISOString(),
    }) + '\n',
  );
});

export default server;
