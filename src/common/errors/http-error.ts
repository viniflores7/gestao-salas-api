export interface FieldError {
  field: string;
  message: string;
}

export class HttpError extends Error {
  readonly status: number;
  readonly errors?: FieldError[];

  constructor(status: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
  }
}
