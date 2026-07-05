import { Role } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        organizationId: string;
        role: Role;
      };
    }
  }
}
