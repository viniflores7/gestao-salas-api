import { HttpError, type FieldError } from '../errors/http-error.ts';

export type ValidationResult<T> =
  { success: true; data: T } | { success: false; errors: FieldError[] };

export type Validator<T> = (input: unknown) => ValidationResult<T>;

export function validateOrThrow<T>(validator: Validator<T>, input: unknown): T {
  const result = validator(input);
  if (!result.success) {
    throw new HttpError(400, 'Invalid request data', result.errors);
  }
  return result.data;
}
