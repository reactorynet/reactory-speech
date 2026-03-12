import { Router, Request, Response, NextFunction } from 'express';
import Reactory from '@reactory/reactory-core';
import { audioUpload } from '../middleware/audioUpload';

/**
 * STT REST routes.
 * POST /api/speech/v1/stt — transcribe uploaded audio file to text
 */
const createSttRoutes = (context: Reactory.Server.IReactoryContext): Router => {
  const router = Router();

  router.post('/', audioUpload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = (req as any).file;
      if (!file) {
        res.status(400).json({ error: 'No audio file uploaded. Use multipart/form-data with field name "file".' });
        return;
      }

      const language = req.body?.language as string | undefined;
      const speechService = context.getService('speech.SpeechService@1.0.0') as any;
      const result = await speechService.transcribe(file.buffer, { language });

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
};

export default createSttRoutes;
