import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.issues,
    });
    return;
  }

  if (
    error instanceof Error &&
    (error.message === 'Unsupported image type.' ||
      error.message === 'Image size must be under 5 MB.' ||
      error.message === 'Image upload failed.' ||
      error.message === 'Could not connect to Cloudinary.')
  ) {
    res
      .status(error.message === 'Could not connect to Cloudinary.' ? 502 : 400)
      .json({
        success: false,
        error: error.message,
      });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
