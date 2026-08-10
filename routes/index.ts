import { Router } from 'express';
import Reactory from '@reactorynet/reactory-core';
import createTtsRoutes from './tts.routes';
import createSttRoutes from './stt.routes';

/**
 * Create all Speech module API routes
 */
const createSpeechApiRoutes = (context: Reactory.Server.IReactoryContext): Router => {
  const router = Router();

  router.use('/api/speech/v1/tts', createTtsRoutes(context));
  router.use('/api/speech/v1/stt', createSttRoutes(context));

  // Error handler for speech routes
  router.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Internal speech service error',
    });
  });

  return router;
};

export default {
  'api': createSpeechApiRoutes,
};
