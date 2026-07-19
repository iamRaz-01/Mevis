import { loadConfig } from '@mevis/config';
import { StructuredLogger } from '@mevis/logger';
import { validateEntity, Entity } from '@mevis/core';

const logger = new StructuredLogger('DashboardApp');
const config = loadConfig();

export function runDashboard(): void {
  logger.info('Initializing Dashboard console interface...', {
    env: config.nodeEnv,
  });

  const mockIncident: Entity = {
    id: 'inc_crowd_05',
    type: 'Incident',
    status: 'Reported',
  };

  const isValid = validateEntity(mockIncident);
  logger.info('Displaying dashboard alerts status...', {
    incidentId: mockIncident.id,
    isValid,
  });
}

runDashboard();
