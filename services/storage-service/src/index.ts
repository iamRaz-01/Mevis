import http from 'node:http';
import { loadServiceConfig, loadStorageConfig } from '@mevis/infrastructure-configuration';
import { LocalStorageAdapter, type StoragePort, StorageError } from '@mevis/infrastructure-storage';

const config = loadServiceConfig('storage-service');
const storageConfig = loadStorageConfig();
const PORT = config.port;

const storage: StoragePort = new LocalStorageAdapter(storageConfig.basePath);

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
    'X-Service': 'storage-service',
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const segments = url.pathname.split('/').filter(Boolean);
  const ts = new Date().toISOString();

  try {
    // POST /api/files — upload a file
    if (req.method === 'POST' && url.pathname === '/api/files') {
      const content = await readBody(req);
      if (content.byteLength > storageConfig.maxFileSizeBytes) {
        return json(res, 413, {
          success: false,
          error: 'File exceeds maximum allowed size.',
          timestamp: ts,
        });
      }
      const meta = await storage.upload({
        originalName: url.searchParams.get('name') ?? 'upload',
        mimeType: req.headers['content-type'] ?? 'application/octet-stream',
        content,
      });
      return json(res, 201, { success: true, data: meta, timestamp: ts });
    }

    // GET /api/files/:id/metadata — retrieve metadata
    if (req.method === 'GET' && segments[1] === 'files' && segments[3] === 'metadata') {
      const id = segments[2];
      const meta = await storage.getMetadata(id!);
      return json(res, 200, { success: true, data: meta, timestamp: ts });
    }

    // GET /api/files/:id — download a file
    if (req.method === 'GET' && segments[1] === 'files' && segments[2] && !segments[3]) {
      const id = segments[2];
      const meta = await storage.getMetadata(id);
      const content = await storage.download(id);
      res.writeHead(200, {
        'Content-Type': meta.mimeType,
        'Content-Length': content.byteLength,
        'Content-Disposition': `attachment; filename="${meta.originalName}"`,
        'X-File-Id': id,
      });
      return res.end(content);
    }

    // DELETE /api/files/:id
    if (req.method === 'DELETE' && segments[1] === 'files' && segments[2]) {
      await storage.delete(segments[2]);
      return json(res, 200, { success: true, data: { deleted: segments[2] }, timestamp: ts });
    }

    // GET /api/health
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, {
        success: true,
        data: { status: 'UP', service: 'storage-service' },
        timestamp: ts,
      });
    }

    json(res, 404, { success: false, error: 'Not found.', timestamp: ts });
  } catch (err) {
    if (err instanceof StorageError && err.name === 'FileNotFoundError') {
      return json(res, 404, { success: false, error: err.message, timestamp: ts });
    }
    const message = err instanceof Error ? err.message : 'Internal server error.';
    json(res, 500, { success: false, error: message, timestamp: ts });
  }
});

server.listen(PORT, () => {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      service: 'storage-service',
      event: 'server_started',
      port: PORT,
      storagePath: storageConfig.basePath,
      provider: storageConfig.provider,
      timestamp: new Date().toISOString(),
    }) + '\n',
  );
});

export default server;
