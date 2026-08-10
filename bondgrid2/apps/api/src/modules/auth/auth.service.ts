import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AdminSignupDto, CreateUserDto, LoginDto, UpdateUserRoleDto, ForgotPasswordDto, VerifyResetOtpDto, ResetPasswordDto } from './auth.schema';
import { AuthRepository } from './auth.repository';
import { AuthSession, AuthUser, Role, User } from './auth.types';
import { EmailService } from '../email/email.service';

interface JwtPayload {
  userId: string;
  organizationId: string;
  role: Role;
}

export class AuthService {
  private readonly emailService = new EmailService();
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

  async forgotPassword(data: ForgotPasswordDto): Promise<void> {
    const user = await this.repository.findUserByEmail(data.email);
    if (!user) return; // Do not reveal email existence

    const now = new Date();
    
    // 60s cooldown check
    if (user.resetOtpLastSentAt) {
      const lastSentAt = new Date(user.resetOtpLastSentAt);
      if (now.getTime() - lastSentAt.getTime() < 60000) {
        return; 
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiry = new Date(now.getTime() + 10 * 60000).toISOString();
    const lastSentAt = now.toISOString();

    await this.repository.savePasswordResetOtp(user.id, otpHash, expiry, lastSentAt);
    await this.emailService.sendPasswordResetOtp(user.email, otp);
  }

  async verifyResetOtp(data: VerifyResetOtpDto): Promise<{ token: string } | null> {
    const user = await this.repository.findUserByEmail(data.email);
    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) return null;

    const attempts = user.resetOtpAttempts || 0;
    if (attempts >= 5) {
      return null;
    }

    await this.repository.incrementOtpAttempts(user.id);

    const now = new Date();
    const expiry = new Date(user.resetOtpExpiry);
    if (now > expiry) {
      return null;
    }

    const isValid = await bcrypt.compare(data.otp, user.resetOtpHash);
    if (!isValid) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 12);
    const tokenExpiry = new Date(now.getTime() + 15 * 60000).toISOString();

    await this.repository.savePasswordResetToken(user.id, tokenHash, tokenExpiry);

    return { token };
  }

  async resetPassword(data: ResetPasswordDto): Promise<boolean> {
    const user = await this.repository.findUserByEmail(data.email);
    if (!user || !user.resetTokenHash || !user.resetTokenExpiry) return false;

    const now = new Date();
    const expiry = new Date(user.resetTokenExpiry);
    if (now > expiry) {
      return false;
    }

    const isValid = await bcrypt.compare(data.token, user.resetTokenHash);
    if (!isValid) return false;

    const newPasswordHash = await bcrypt.hash(data.newPassword, 12);
    await this.repository.updatePasswordAndClearResetData(user.id, newPasswordHash);

    return true;
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
