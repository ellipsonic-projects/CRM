import { Request, Response } from 'express';

export const AUTH_COOKIE_NAME = 'bondgrid_session';

export function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  });
}
