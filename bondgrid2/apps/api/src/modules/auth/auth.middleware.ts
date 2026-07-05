import { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME, getCookie } from '../../utils/cookies';
import { AuthService } from './auth.service';

const authService = new AuthService();

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice('Bearer '.length)
    : undefined;
  const token = bearerToken ?? getCookie(req, AUTH_COOKIE_NAME);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
    return;
  }

  try {
    req.user = authService.verifyToken(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session.',
    });
  }
}
