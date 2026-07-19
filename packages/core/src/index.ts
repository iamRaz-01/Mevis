import { Entity } from '@mevis/shared-types';
export { Entity } from '@mevis/shared-types';

/**
 * Validates that an entity contains all required metadata.
 * @param entity The MEVIS entity to validate.
 * @returns True if valid, false otherwise.
 */
export function validateEntity(entity: Entity): boolean {
  if (!entity.id || !entity.type || !entity.status) {
    return false;
  }
  return true;
}
