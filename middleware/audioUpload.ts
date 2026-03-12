// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

const storage = multer.memoryStorage();

/**
 * Multer middleware for audio file uploads.
 * Accepts a single file in the 'file' field, up to 25MB.
 */
export const audioUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/webm',
      'audio/ogg',
      'audio/mpeg',
      'audio/mp3',
      'audio/flac',
      'audio/x-flac',
      'application/octet-stream', // browsers sometimes send this
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});
