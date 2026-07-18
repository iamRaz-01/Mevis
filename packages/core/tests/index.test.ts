import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateEntity, Entity } from '../src/index.js';

describe('Entity Validation Service Tests', () => {
  it('should return true for a valid entity', () => {
    const validEntity: Entity = {
      id: 'vol_001',
      type: 'Volunteer',
      status: 'Active',
    };
    assert.strictEqual(validateEntity(validEntity), true);
  });

  it('should return false for an invalid entity with empty fields', () => {
    const invalidEntity = {
      id: '',
      type: 'Volunteer',
      status: '',
    } as Entity;
    assert.strictEqual(validateEntity(invalidEntity), false);
  });
});
