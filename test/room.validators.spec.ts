import { randomUUID } from 'node:crypto';
import { HttpError } from '../src/common/errors/http-error.ts';
import { validateOrThrow } from '../src/common/validation/validate.ts';
import {
  validateCreateRoom,
  validateRoomId,
  validateUpdateRoom,
} from '../src/modules/rooms/validators/room.validators.ts';

describe('validateCreateRoom', () => {
  it('accepts a valid room, trimming text and turning blank text into null', () => {
    expect(
      validateCreateRoom({
        name: '  Sala 101 ',
        capacity: 40,
        location: ' Bloco A ',
        description: '   ',
      }),
    ).toEqual({
      success: true,
      data: {
        name: 'Sala 101',
        capacity: 40,
        location: 'Bloco A',
        description: null,
      },
    });
  });

  it('requires name and capacity', () => {
    expect(validateCreateRoom({})).toEqual({
      success: false,
      errors: [
        { field: 'name', message: 'must be a non-empty string' },
        { field: 'capacity', message: 'must be an integer greater than zero' },
      ],
    });
  });

  it.each([0, -3, 2.5, '10', null])('rejects capacity %s', (capacity) => {
    expect(validateCreateRoom({ name: 'Sala', capacity })).toMatchObject({
      success: false,
      errors: [{ field: 'capacity' }],
    });
  });

  it('rejects texts above the column limits', () => {
    const result = validateCreateRoom({
      name: 'a'.repeat(101),
      capacity: 1,
      location: 'b'.repeat(151),
      description: 'c'.repeat(1001),
    });

    expect(result).toMatchObject({
      success: false,
      errors: [
        { field: 'name' },
        { field: 'location' },
        { field: 'description' },
      ],
    });
  });

  it('rejects fields that are not part of a room', () => {
    expect(
      validateCreateRoom({ name: 'Sala', capacity: 5, id: 'x', active: false }),
    ).toEqual({
      success: false,
      errors: [
        { field: 'id', message: 'is not allowed' },
        { field: 'active', message: 'is not allowed' },
      ],
    });
  });

  it.each([null, [], 'text', 42])('rejects a body that is %j', (body) => {
    expect(validateCreateRoom(body)).toEqual({
      success: false,
      errors: [{ field: 'body', message: 'must be a JSON object' }],
    });
  });
});

describe('validateUpdateRoom', () => {
  it('returns only the fields that were sent', () => {
    expect(validateUpdateRoom({ capacity: 12, active: false })).toEqual({
      success: true,
      data: { capacity: 12, active: false },
    });
  });

  it('allows clearing optional texts with null', () => {
    expect(validateUpdateRoom({ location: null })).toEqual({
      success: true,
      data: { location: null },
    });
  });

  it('requires at least one field', () => {
    expect(validateUpdateRoom({})).toMatchObject({
      success: false,
      errors: [{ field: 'body' }],
    });
  });

  it('validates each field that was sent', () => {
    expect(
      validateUpdateRoom({ name: '', capacity: 0, active: 'yes' }),
    ).toMatchObject({
      success: false,
      errors: [{ field: 'name' }, { field: 'capacity' }, { field: 'active' }],
    });
  });
});

describe('validateRoomId', () => {
  it('accepts a UUID and rejects anything else', () => {
    const id = randomUUID();

    expect(validateRoomId(id)).toEqual({ success: true, data: id });
    expect(validateRoomId('123')).toMatchObject({ success: false });
  });
});

describe('validateOrThrow', () => {
  it('returns the validated data', () => {
    const id = randomUUID();

    expect(validateOrThrow(validateRoomId, id)).toBe(id);
  });

  it('throws a 400 HttpError carrying the field errors', () => {
    expect(() => validateOrThrow(validateRoomId, 'invalid')).toThrow(
      expect.objectContaining({
        constructor: HttpError,
        status: 400,
        message: 'Invalid request data',
        errors: [{ field: 'id', message: 'must be a valid UUID' }],
      }),
    );
  });
});
