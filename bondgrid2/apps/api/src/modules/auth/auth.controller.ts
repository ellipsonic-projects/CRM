import { NextFunction, Request, Response } from 'express';
import { recordAudit } from '../audit';
import { clearAuthCookie, setAuthCookie } from '../../utils/cookies';
import {
  adminSignupSchema,
  createUserSchema,
  loginSchema,
  updateUserRoleSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from './auth.schema';
import { AuthService } from './auth.service';
import { User } from './auth.types';

function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const safeUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return safeUser;
}

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
      void recordAudit({
        organizationId: session.user.organizationId,
        userId: session.user.userId,
        userName: session.user.fullName,
        action: 'LOGIN',
        entity: 'Auth',
        summary: `${session.user.fullName} logged in.`,
      });

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
      void recordAudit({
        organizationId: session.user.organizationId,
        userId: session.user.userId,
        userName: session.user.fullName,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: session.user.userId,
        entityName: session.user.fullName,
        summary: `${session.user.fullName} created the organization admin account.`,
      });

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

  listUsers = async (
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

      const users = await this.authService.listUsers(req.user.organizationId);

      res.status(200).json({
        success: true,
        data: users.map(sanitizeUser),
      });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (
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

      const body = createUserSchema.parse(req.body);
      const user = await this.authService.createUser(
        req.user.organizationId,
        body,
      );

      if (!user) {
        res.status(409).json({
          success: false,
          error: 'A user with this email or phone already exists.',
        });
        return;
      }

      void recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: user.id,
        entityName: user.fullName,
        summary: `Created user ${user.fullName} with ${user.role} role.`,
      });

      res.status(201).json({
        success: true,
        data: sanitizeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  updateUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!req.user || typeof id !== 'string') {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const body = updateUserRoleSchema.parse(req.body);
      const user = await this.authService.updateUserRole(
        req.user.organizationId,
        id,
        body,
      );

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        });
        return;
      }

      void recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'UPDATE_USER_ROLE',
        entity: 'User',
        entityId: user.id,
        entityName: user.fullName,
        summary: `Changed ${user.fullName}'s role to ${user.role}.`,
      });

      res.status(200).json({
        success: true,
        data: sanitizeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    if (req.user) {
      void recordAudit({
        organizationId: req.user.organizationId,
        userId: req.user.userId,
        action: 'LOGOUT',
        entity: 'Auth',
        summary: 'User logged out.',
      });
    }

    clearAuthCookie(res);
    res.status(204).send();
  };

  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = forgotPasswordSchema.parse(req.body);
      await this.authService.forgotPassword(body);

      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.',
      });
    } catch (error) {
      next(error);
    }
  };

  verifyResetOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = verifyResetOtpSchema.parse(req.body);
      const result = await this.authService.verifyResetOtp(body);

      if (!result) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired OTP.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = resetPasswordSchema.parse(req.body);
      const success = await this.authService.resetPassword(body);

      if (!success) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired token.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Password has been successfully reset.',
      });
    } catch (error) {
      next(error);
    }
  };
}
