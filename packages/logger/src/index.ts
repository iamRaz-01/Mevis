export type LogLevel = 'info' | 'warn' | 'error';

/**
 * Basic structured logging manager.
 */
export class StructuredLogger {
  constructor(private context: string) {}

  info(msg: string, meta?: Record<string, unknown>): void {
    this.log('info', msg, meta);
  }

  warn(msg: string, meta?: Record<string, unknown>): void {
    this.log('warn', msg, meta);
  }

  error(msg: string, meta?: Record<string, unknown>): void {
    this.log('error', msg, meta);
  }

  private log(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
    const logObj = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message: msg,
      ...meta,
    };
    console.log(JSON.stringify(logObj));
  }
}
