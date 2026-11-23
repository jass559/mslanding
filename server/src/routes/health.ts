import { Router } from 'express';

/**
 * Reports HTTP readiness without depending on Prisma or business data.
 */
export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});
