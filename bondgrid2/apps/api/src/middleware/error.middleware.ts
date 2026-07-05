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

  console.error(error);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
