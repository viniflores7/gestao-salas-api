import request from 'supertest';
import { createApp } from '../src/app.ts';

describe('app', () => {
  it('answers unknown routes with 404 in JSON', async () => {
    const response = await request(createApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Route GET /does-not-exist not found',
    });
  });
});
