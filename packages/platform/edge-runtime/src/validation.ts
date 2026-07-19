import { type StandardError } from '@mevis/platform-contracts';

export interface SchemaField {
  readonly type: 'string' | 'number' | 'boolean';
  readonly required?: boolean;
  readonly min?: number;
  readonly max?: number;
}

export interface RequestSchema {
  readonly body?: Record<string, SchemaField>;
  readonly query?: Record<string, SchemaField>;
}

export class RequestValidator {
  /**
   * Validates a request against a schema. Returns an array of errors if invalid, or null if valid.
   */
  static validate(
    schema: RequestSchema,
    body: Record<string, unknown> = {},
    query: Record<string, unknown> = {},
  ): StandardError[] | null {
    const errors: StandardError[] = [];

    // 1. Validate Query Params
    if (schema.query) {
      for (const [key, field] of Object.entries(schema.query)) {
        const val = query[key];
        const fieldErrors = RequestValidator.validateField('query', key, val, field);
        if (fieldErrors) errors.push(...fieldErrors);
      }
    }

    // 2. Validate Body Params
    if (schema.body) {
      for (const [key, field] of Object.entries(schema.body)) {
        const val = body[key];
        const fieldErrors = RequestValidator.validateField('body', key, val, field);
        if (fieldErrors) errors.push(...fieldErrors);
      }
    }

    return errors.length > 0 ? errors : null;
  }

  private static validateField(
    location: 'body' | 'query',
    name: string,
    val: unknown,
    field: SchemaField,
  ): StandardError[] | null {
    const errors: StandardError[] = [];
    const path = `${location}.${name}`;

    if (val === undefined || val === null || val === '') {
      if (field.required) {
        errors.push({
          code: 'FIELD_REQUIRED',
          message: `Field "${path}" is required.`,
          field: path,
        });
      }
      return errors.length > 0 ? errors : null;
    }

    // Type validation
    if (field.type === 'number') {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Field "${path}" must be a number.`,
          field: path,
        });
      } else {
        if (field.min !== undefined && num < field.min) {
          errors.push({
            code: 'FIELD_TOO_SMALL',
            message: `Field "${path}" must be at least ${field.min}.`,
            field: path,
          });
        }
        if (field.max !== undefined && num > field.max) {
          errors.push({
            code: 'FIELD_TOO_LARGE',
            message: `Field "${path}" must be at most ${field.max}.`,
            field: path,
          });
        }
      }
    } else if (field.type === 'boolean') {
      const isBool = val === true || val === false || val === 'true' || val === 'false';
      if (!isBool) {
        errors.push({
          code: 'INVALID_TYPE',
          message: `Field "${path}" must be a boolean.`,
          field: path,
        });
      }
    } else if (field.type === 'string') {
      const str = String(val);
      if (field.min !== undefined && str.length < field.min) {
        errors.push({
          code: 'FIELD_TOO_SHORT',
          message: `Field "${path}" must be at least ${field.min} characters.`,
          field: path,
        });
      }
      if (field.max !== undefined && str.length > field.max) {
        errors.push({
          code: 'FIELD_TOO_LONG',
          message: `Field "${path}" must be at most ${field.max} characters.`,
          field: path,
        });
      }
    }

    return errors.length > 0 ? errors : null;
  }
}
