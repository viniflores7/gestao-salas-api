import express from 'express';
import { errorHandler } from './common/middlewares/error-handler.ts';
import { notFoundHandler } from './common/middlewares/not-found-handler.ts';
import { pool } from './database/pool.ts';
import { roomsRouter } from './modules/rooms/routes/rooms.routes.ts';

export const API_PREFIX = '/api/v1';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'error', database: 'down' });
    }
  });

  app.use(`${API_PREFIX}/rooms`, roomsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
