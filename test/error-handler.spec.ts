import express from 'express';
import request from 'supertest';
import { HttpError } from '../src/common/errors/http-error.ts';
import { errorHandler } from '../src/common/middlewares/error-handler.ts';

function appThrowing(error: unknown) {
  const app = express();
  app.use(express.json());
  app.post('/', () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('answers an HttpError with its status, message and field errors', async () => {
    const errors = [{ field: 'name', message: 'must be a non-empty string' }];

    const response = await request(
      appThrowing(new HttpError(400, 'Invalid request data', errors)),
    ).post('/');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid request data', errors });
  });

  it('omits the errors list when the HttpError has none', async () => {
    const response = await request(
      appThrowing(new HttpError(404, 'Room not found')),
    ).post('/');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Room not found' });
  });

  it('answers malformed JSON with 400', async () => {
    const response = await request(appThrowing(new Error('unreachable')))
      .post('/')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Malformed JSON body' });
  });

  it('answers a Postgres unique violation with 409', async () => {
    const response = await request(
      appThrowing(Object.assign(new Error('duplicate'), { code: '23505' })),
    ).post('/');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Resource already exists' });
  });

  it('hides unexpected errors behind a generic 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(
      appThrowing(new Error('connection string leaked')),
    ).post('/');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal server error' });
  });
});
