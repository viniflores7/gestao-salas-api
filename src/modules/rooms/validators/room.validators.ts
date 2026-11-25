import type { FieldError } from '../../../common/errors/http-error.ts';
import type { ValidationResult } from '../../../common/validation/validate.ts';
import type { CreateRoomInput, UpdateRoomInput } from '../models/room.ts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_MAX_LENGTH = 100;
const LOCATION_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 1000;
const CREATE_FIELDS = ['name', 'capacity', 'location', 'description'];
const UPDATE_FIELDS = [...CREATE_FIELDS, 'active'];

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function rejectUnknownFields(
  body: Record<string, unknown>,
  allowedFields: string[],
  errors: FieldError[],
) {
  for (const field of Object.keys(body)) {
    if (!allowedFields.includes(field)) {
      errors.push({ field, message: 'is not allowed' });
    }
  }
}

function readName(value: unknown, errors: FieldError[]): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push({ field: 'name', message: 'must be a non-empty string' });
    return undefined;
  }
  const name = value.trim();
  if (name.length > NAME_MAX_LENGTH) {
    errors.push({
      field: 'name',
      message: `must have at most ${NAME_MAX_LENGTH} characters`,
    });
  }
  return name;
}

function readCapacity(
  value: unknown,
  errors: FieldError[],
): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    errors.push({
      field: 'capacity',
      message: 'must be an integer greater than zero',
    });
    return undefined;
  }
  return value;
}

function readOptionalText(
  field: string,
  value: unknown,
  maxLength: number,
  errors: FieldError[],
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    errors.push({ field, message: 'must be a string or null' });
    return null;
  }
  const text = value.trim();
  if (text.length > maxLength) {
    errors.push({
      field,
      message: `must have at most ${maxLength} characters`,
    });
  }
  return text === '' ? null : text;
}

function readActive(value: unknown, errors: FieldError[]): boolean {
  if (typeof value !== 'boolean') {
    errors.push({ field: 'active', message: 'must be a boolean' });
    return false;
  }
  return value;
}

const notAnObject: ValidationResult<never> = {
  success: false,
  errors: [{ field: 'body', message: 'must be a JSON object' }],
};

export function validateCreateRoom(
  input: unknown,
): ValidationResult<CreateRoomInput> {
  if (!isPlainObject(input)) return notAnObject;

  const errors: FieldError[] = [];
  rejectUnknownFields(input, CREATE_FIELDS, errors);
  const name = readName(input.name, errors);
  const capacity = readCapacity(input.capacity, errors);
  const location = readOptionalText(
    'location',
    input.location,
    LOCATION_MAX_LENGTH,
    errors,
  );
  const description = readOptionalText(
    'description',
    input.description,
    DESCRIPTION_MAX_LENGTH,
    errors,
  );

  if (errors.length > 0 || name === undefined || capacity === undefined) {
    return { success: false, errors };
  }
  return { success: true, data: { name, capacity, location, description } };
}

export function validateUpdateRoom(
  input: unknown,
): ValidationResult<UpdateRoomInput> {
  if (!isPlainObject(input)) return notAnObject;

  const errors: FieldError[] = [];
  const data: UpdateRoomInput = {};
  rejectUnknownFields(input, UPDATE_FIELDS, errors);

  if (!UPDATE_FIELDS.some((field) => input[field] !== undefined)) {
    errors.push({
      field: 'body',
      message: `must contain at least one of: ${UPDATE_FIELDS.join(', ')}`,
    });
  }
  if (input.name !== undefined) data.name = readName(input.name, errors);
  if (input.capacity !== undefined) {
    data.capacity = readCapacity(input.capacity, errors);
  }
  if (input.location !== undefined) {
    data.location = readOptionalText(
      'location',
      input.location,
      LOCATION_MAX_LENGTH,
      errors,
    );
  }
  if (input.description !== undefined) {
    data.description = readOptionalText(
      'description',
      input.description,
      DESCRIPTION_MAX_LENGTH,
      errors,
    );
  }
  if (input.active !== undefined)
    data.active = readActive(input.active, errors);

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

export function validateRoomId(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string' || !UUID_PATTERN.test(input)) {
    return {
      success: false,
      errors: [{ field: 'id', message: 'must be a valid UUID' }],
    };
  }
  return { success: true, data: input };
}
