// backend/src/app.js
import express from 'express';
import cors from 'cors';
import { SystemClock } from './clock/clock.js';
import { createMatchAndTicketController } from './controllers/matchAndTicketController.js';
import { createApiRouter } from './routes/api.js';

export function createApp(clock = new SystemClock()) {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || '*',
    })
  );
  app.use(express.json());

  const controller = createMatchAndTicketController(clock);
  app.use('/api', createApiRouter(controller));

  return app;
}