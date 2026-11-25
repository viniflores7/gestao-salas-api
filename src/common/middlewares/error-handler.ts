import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../errors/http-error.ts';

const POSTGRES_UNIQUE_VIOLATION = '23505';
const MALFORMED_JSON = 'entity.parse.failed';

function hasProperty<K extends string>(
  error: unknown,
  key: K,
): error is Record<K, unknown> {
  return typeof error === 'object' && error !== null && key in error;
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json(
        error.errors
          ? { message: error.message, errors: error.errors }
          : { message: error.message },
      );
    return;
  }

  if (hasProperty(error, 'type') && error.type === MALFORMED_JSON) {
    res.status(400).json({ message: 'Malformed JSON body' });
    return;
  }

  if (hasProperty(error, 'code') && error.code === POSTGRES_UNIQUE_VIOLATION) {
    res.status(409).json({ message: 'Resource already exists' });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
};
