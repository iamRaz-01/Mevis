/**
 * Basic validation utility for MEVIS entities.
 */
export interface Entity {
  id: string;
  type: string;
  status: string;
}

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
