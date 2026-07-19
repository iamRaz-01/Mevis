import http from 'node:http';
import { loadServiceConfig, loadDatabaseConfig } from '@mevis/infrastructure-configuration';
import { secrets } from '@mevis/infrastructure-secrets';

const config = loadServiceConfig('configuration-service');
const PORT = config.port;

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
    'X-Service': 'configuration-service',
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  // GET /api/config — return non-sensitive platform configuration
  if (req.method === 'GET' && url.pathname === '/api/config') {
    const dbConfig = loadDatabaseConfig();
    return json(res, 200, {
      success: true,
      data: {
        service: config,
        database: {
          poolMin: dbConfig.poolMin,
          poolMax: dbConfig.poolMax,
          // URL is intentionally omitted — sensitive
        },
        secretsPresent: {
          JWT_SECRET: !!secrets.get('JWT_SECRET'),
          DB_PASSWORD: !!secrets.get('DB_PASSWORD'),
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/health
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return json(res, 200, {
      success: true,
      data: { status: 'UP', service: 'configuration-service' },
      timestamp: new Date().toISOString(),
    });
  }

  json(res, 404, { success: false, error: 'Not found.', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      service: 'configuration-service',
      event: 'server_started',
      port: PORT,
      environment: config.environment,
      timestamp: new Date().toISOString(),
    }) + '\n',
  );
});

export default server;
