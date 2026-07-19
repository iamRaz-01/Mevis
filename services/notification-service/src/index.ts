import http from 'node:http';
import { loadServiceConfig } from '@mevis/infrastructure-configuration';
import {
  ConsoleNotificationAdapter,
  type NotificationPort,
  type NotificationRequest,
} from '@mevis/infrastructure-notification';
import { audit } from '@mevis/infrastructure-auditing';

const config = loadServiceConfig('notification-service');
const PORT = config.port;

const notifier: NotificationPort = new ConsoleNotificationAdapter();

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
    'X-Service': 'notification-service',
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
    // POST /api/notifications — dispatch a notification
    if (req.method === 'POST' && url.pathname === '/api/notifications') {
      const body = (await readJson(req)) as NotificationRequest;

      if (!body.recipients?.length || !body.channels?.length || !body.subject || !body.body) {
        return json(res, 400, {
          success: false,
          error: 'Missing required fields: recipients, channels, subject, body.',
          timestamp: ts,
        });
      }

      const result = await notifier.send(body);

      await audit.emit({
        actorId: 'system',
        action: 'NOTIFICATION_SENT',
        outcome: result.status === 'sent' ? 'SUCCESS' : 'PARTIAL',
        resourceType: 'notification',
        resourceId: result.id,
        metadata: {
          channels: result.deliveredChannels,
          recipientCount: body.recipients.length,
          priority: body.priority,
        },
      });

      return json(res, 202, { success: true, data: result, timestamp: ts });
    }

    // GET /api/health
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, {
        success: true,
        data: { status: 'UP', service: 'notification-service' },
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
      service: 'notification-service',
      event: 'server_started',
      port: PORT,
      environment: config.environment,
      timestamp: new Date().toISOString(),
    }) + '\n',
  );
});

export default server;
