import request from 'supertest';
import { createApp } from '../src/app.ts';
import { pool } from '../src/database/pool.ts';

describe('GET /health', () => {
  afterAll(() => pool.end());

  it('reports the database as up', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });
});
