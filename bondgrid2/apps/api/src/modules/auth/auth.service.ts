import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AdminSignupDto, CreateUserDto, LoginDto, UpdateUserRoleDto } from './auth.schema';
import { AuthRepository } from './auth.repository';
import { AuthSession, AuthUser, Role, User } from './auth.types';

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: Role;
}

export class AuthService {
  constructor(private readonly repository = new AuthRepository()) {}

  async login(data: LoginDto): Promise<AuthSession | null> {
    const user = await this.repository.findUserByEmailOrPhone(data.identifier);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    const authUser: AuthUser = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    };

    return {
      token: this.signToken(authUser),
      user: authUser,
    };
  }

  async adminSignup(data: AdminSignupDto): Promise<AuthSession> {
    const passwordHash = await bcrypt.hash(data.admin.password, 12);
    const user = await this.repository.createAdminWithOrganization({
      data,
      passwordHash,
    });

    return {
      token: this.signToken(user),
      user,
    };
  }

  async listUsers(organizationId: string): Promise<User[]> {
    return this.repository.findUsersByOrganization(organizationId);
  }

  async createUser(
    organizationId: string,
    data: CreateUserDto,
  ): Promise<User | null> {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.repository.createUser(organizationId, data, passwordHash);
  }

  async updateUserRole(
    organizationId: string,
    userId: string,
    data: UpdateUserRoleDto,
  ): Promise<User | null> {
    return this.repository.updateUserRole(organizationId, userId, data);
  }

  async getSession(payload: JwtPayload): Promise<AuthUser | null> {
    return this.repository.findAuthUserById(payload.userId);
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  }

  private signToken(user: AuthUser): string {
    return jwt.sign(
      {
        userId: user.userId,
        organizationId: user.organizationId,
        role: user.role,
      },
      env.jwtSecret,
      { expiresIn: '7d' },
    );
  }
}
