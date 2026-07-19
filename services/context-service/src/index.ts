import { loadConfig } from '@mevis/config';
import { StructuredLogger } from '@mevis/logger';
import { validateEntity, Entity } from '@mevis/core';

const logger = new StructuredLogger('ContextService');
const config = loadConfig();

export function startService(): void {
  logger.info('Starting MEVIS Context Service...', {
    env: config.nodeEnv,
    port: config.port,
  });

  const mockVolunteer: Entity = {
    id: 'vol_medical_01',
    type: 'Volunteer',
    status: 'Active',
  };

  const isValid = validateEntity(mockVolunteer);
  logger.info('Validating mock entities status...', {
    entityId: mockVolunteer.id,
    isValid,
  });
}

// Start if executed directly
if (process.argv[1]?.endsWith('index.js')) {
  startService();
}
