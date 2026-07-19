import http from 'node:http';
import { loadServiceConfig } from '@mevis/infrastructure-configuration';
import {
  HealthAggregator,
  SelfHealthChecker,
  type HealthChecker,
  type DependencyHealth,
} from '@mevis/infrastructure-health';

const config = loadServiceConfig('health-service');
const PORT = config.port;

// Register a checker for every downstream infrastructure service.
// Checkers can be added per-service without modifying the aggregator.
class HttpServiceChecker implements HealthChecker {
  constructor(
    public readonly name: string,
    private readonly healthUrl: string,
    private readonly timeoutMs = 3000,
  ) {}

  async check(): Promise<DependencyHealth> {
    const start = Date.now();
    return new Promise<DependencyHealth>((resolve) => {
      const req = http.get(this.healthUrl, { timeout: this.timeoutMs }, (res) => {
        res.resume(); // drain
        const responseTimeMs = Date.now() - start;
        if (res.statusCode === 200) {
          resolve({ name: this.name, status: 'UP', responseTimeMs });
        } else {
          resolve({
            name: this.name,
            status: 'DEGRADED',
            responseTimeMs,
            detail: `HTTP ${res.statusCode}`,
          });
        }
      });
      req.on('error', (err) => {
        resolve({ name: this.name, status: 'DOWN', detail: err.message });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ name: this.name, status: 'DOWN', detail: 'Timeout exceeded.' });
      });
    });
  }
}

const aggregator = new HealthAggregator(
  'health-service',
  process.env['npm_package_version'] ?? '1.0.0',
  config.environment,
);

aggregator
  .register(new SelfHealthChecker())
  .register(
    new HttpServiceChecker(
      'configuration-service',
      `http://localhost:${process.env['CONFIGURATION_SERVICE_PORT'] ?? 3001}/api/health`,
    ),
  )
  .register(
    new HttpServiceChecker(
      'storage-service',
      `http://localhost:${process.env['STORAGE_SERVICE_PORT'] ?? 3002}/api/health`,
    ),
  )
  .register(
    new HttpServiceChecker(
      'notification-service',
      `http://localhost:${process.env['NOTIFICATION_SERVICE_PORT'] ?? 3003}/api/health`,
    ),
  )
  .register(
    new HttpServiceChecker(
      'audit-service',
      `http://localhost:${process.env['AUDIT_SERVICE_PORT'] ?? 3004}/api/health`,
    ),
  );

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
    'X-Service': 'health-service',
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const ts = new Date().toISOString();

  // GET /api/health — full aggregate health report
  if (req.method === 'GET' && url.pathname === '/api/health') {
    const report = await aggregator.report();
    const statusCode = report.status === 'UP' ? 200 : report.status === 'DEGRADED' ? 207 : 503;
    return json(res, statusCode, { success: report.status === 'UP', data: report, timestamp: ts });
  }

  // GET /api/health/live — liveness probe (just checks process is up)
  if (req.method === 'GET' && url.pathname === '/api/health/live') {
    return json(res, 200, { success: true, data: { alive: true }, timestamp: ts });
  }

  // GET /api/health/ready — readiness probe
  if (req.method === 'GET' && url.pathname === '/api/health/ready') {
    const report = await aggregator.report();
    const ready = report.status === 'UP' || report.status === 'DEGRADED';
    return json(res, ready ? 200 : 503, {
      success: ready,
      data: { ready, status: report.status },
      timestamp: ts,
    });
  }

  json(res, 404, { success: false, error: 'Not found.', timestamp: ts });
});

server.listen(PORT, () => {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      service: 'health-service',
      event: 'server_started',
      port: PORT,
      environment: config.environment,
      timestamp: new Date().toISOString(),
    }) + '\n',
  );
});

export default server;
