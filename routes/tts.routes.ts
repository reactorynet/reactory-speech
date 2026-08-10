import { Router, Request, Response, NextFunction } from 'express';
import Reactory from '@reactorynet/reactory-core';

/**
 * TTS REST routes.
 * POST /api/speech/v1/tts — synthesize text to speech, returns WAV audio
 */
const createTtsRoutes = (context: Reactory.Server.IReactoryContext): Router => {
  const router = Router();

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, voice, speed } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "text" field' });
        return;
      }

      const speechService = context.getService('speech.SpeechService@1.0.0') as any;
      const result = await speechService.synthesize(text, { voice, speed });

      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': String(result.audioBuffer.length),
        'X-Audio-Duration': String(result.duration),
        'X-Sample-Rate': String(result.sampleRate),
      });
      res.send(result.audioBuffer);
    } catch (err) {
      next(err);
    }
  });

  return router;
};

export default createTtsRoutes;
