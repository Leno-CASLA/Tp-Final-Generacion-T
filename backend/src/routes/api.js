import { Router } from 'express';
import { requireRole } from '../middlewares/auth.js';

export function createApiRouter(controller) {
  const router = Router();

  router.get('/health', controller.health);
  router.get('/matches', controller.listMatches);
  router.post('/matches', requireRole('ADMIN'), controller.createMatch);
  router.post('/tickets', controller.buyTicket);
  router.post('/tickets/:id/cancel', controller.cancelTicket);

  return router;
}