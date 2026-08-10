import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    const subject = 'Password Reset Verification Code';
    const text = `Hello,\n\nYour password reset verification code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request a password reset, you can safely ignore this email.\n`;
    
    await this.transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
    });
  }
}
