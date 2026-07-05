import { NextFunction, Request, Response } from 'express';
import { clearAuthCookie, setAuthCookie } from '../../utils/cookies';
import { adminSignupSchema, loginSchema } from './auth.schema';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = loginSchema.parse(req.body);
      const session = await this.authService.login(body);

      if (!session) {
        res.status(401).json({
          success: false,
          error: 'Invalid email, phone, or password.',
        });
        return;
      }

      setAuthCookie(res, session.token);

      res.status(200).json({
        success: true,
        data: session.user,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'A user with this email or phone already exists.'
      ) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  };

  adminSignup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = adminSignupSchema.parse(req.body);
      const session = await this.authService.adminSignup(body);

      setAuthCookie(res, session.token);

      res.status(201).json({
        success: true,
        data: session.user,
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const user = await this.authService.getSession(req.user);

      if (!user) {
        clearAuthCookie(res);
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    clearAuthCookie(res);
    res.status(204).send();
  };
}
