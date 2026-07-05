import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(new Error('Unsupported image type.'));
      return;
    }

    callback(null, true);
  },
});

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return 'Image size must be under 5 MB.';
  }

  if (error instanceof Error && error.message === 'Unsupported image type.') {
    return error.message;
  }

  return 'Image upload failed.';
}

export function singleImageUpload(fieldName: string) {
  const middleware = imageUpload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (error: unknown) => {
      if (error) {
        res.status(400).json({
          success: false,
          error: getUploadErrorMessage(error),
        });
        return;
      }

      next();
    });
  };
}
