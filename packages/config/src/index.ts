export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  logLevel: string;
  enableSimulation: boolean;
}

/**
 * Loads configuration from environment variables with safe fallback values.
 */
export function loadConfig(): EnvironmentConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    enableSimulation: process.env.ENABLE_SIMULATION === 'true',
  };
}
