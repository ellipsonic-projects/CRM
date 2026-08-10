import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;

export const roleSchema = z.enum(['ADMIN', 'VOLUNTEER', 'VIEWER']);

export const loginSchema = z.object({
  identifier: z
    .string({ error: 'Please enter your email or phone number.' })
    .trim()
    .min(1, { message: 'Please enter your email or phone number.' }),
  password: z
    .string({ error: 'Password is required.' })
    .min(1, { message: 'Password is required.' }),
});

export const adminSignupSchema = z
  .object({
    admin: z.object({
      fullName: z
        .string({ error: 'Full name is required.' })
        .trim()
        .min(2, { message: 'Full name is required.' })
        .max(100, { message: 'Full name must be 100 characters or less.' }),
      email: z
        .string({ error: 'Please enter a valid email address.' })
        .trim()
        .email({ message: 'Please enter a valid email address.' }),
      phone: z
        .string({
          error: 'Please enter a valid 10-digit Indian mobile number.',
        })
        .regex(/^[6-9]\d{9}$/, {
          message: 'Please enter a valid 10-digit Indian mobile number.',
        }),
      password: z
        .string({ error: 'Password is required.' })
        .min(PASSWORD_MIN_LENGTH, {
          message: 'Password must be between 8 and 16 characters.',
        })
        .max(PASSWORD_MAX_LENGTH, {
          message: 'Password must be between 8 and 16 characters.',
        }),
      confirmPassword: z
        .string({ error: 'Please confirm your password.' })
        .min(1, { message: 'Please confirm your password.' })
        .max(PASSWORD_MAX_LENGTH, {
          message: 'Password must be between 8 and 16 characters.',
        }),
    }),
    organization: z.object({
      name: z
        .string({ error: 'Organization name is required.' })
        .trim()
        .min(2, { message: 'Organization name is required.' })
        .max(120, {
          message: 'Organization name must be 120 characters or less.',
        }),
      organizationType: z.enum(
        [
          'Temple',
          'Trust',
          'NGO',
          'Community',
          'Association',
          'Educational Institution',
          'Other',
        ],
        { error: 'Please select an organization type.' },
      ),
      state: z
        .string({ error: 'Please select a state.' })
        .trim()
        .min(2, { message: 'Please select a state.' })
        .max(100, { message: 'State must be 100 characters or less.' }),
      city: z
        .string({ error: 'Please enter a city.' })
        .trim()
        .min(2, { message: 'Please enter a city.' })
        .max(100, { message: 'City must be 100 characters or less.' }),
      area: z
        .string({ error: 'Please enter a valid area.' })
        .trim()
        .min(1, { message: 'Please enter a valid area.' })
        .max(100, { message: 'Area must be 100 characters or less.' })
        .optional(),
      logo: z
        .string({ error: 'Please enter a valid logo URL.' })
        .url({ message: 'Please enter a valid logo URL.' })
        .optional(),
    }),
  })
  .refine((data) => data.admin.password === data.admin.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['admin', 'confirmPassword'],
  });

export const createUserSchema = z.object({
  fullName: z
    .string({ error: 'Full name is required.' })
    .trim()
    .min(2, { message: 'Full name is required.' })
    .max(100, { message: 'Full name must be 100 characters or less.' }),
  email: z
    .string({ error: 'Please enter a valid email address.' })
    .trim()
    .email({ message: 'Please enter a valid email address.' }),
  phone: z
    .string({
      error: 'Please enter a valid 10-digit Indian mobile number.',
    })
    .regex(/^[6-9]\d{9}$/, {
      message: 'Please enter a valid 10-digit Indian mobile number.',
    }),
  password: z
    .string({ error: 'Password is required.' })
    .min(PASSWORD_MIN_LENGTH, {
      message: 'Password must be between 8 and 16 characters.',
    })
    .max(PASSWORD_MAX_LENGTH, {
      message: 'Password must be between 8 and 16 characters.',
    }),
  role: roleSchema,
});

export const updateUserRoleSchema = z.object({
  role: roleSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;
export type AdminSignupDto = z.infer<typeof adminSignupSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: 'Please enter a valid email address.' })
    .trim()
    .email({ message: 'Please enter a valid email address.' }),
});

export const verifyResetOtpSchema = z.object({
  email: z
    .string({ error: 'Please enter a valid email address.' })
    .trim()
    .email({ message: 'Please enter a valid email address.' }),
  otp: z
    .string({ error: 'OTP is required.' })
    .trim()
    .length(6, { message: 'OTP must be exactly 6 digits.' })
    .regex(/^\d+$/, { message: 'OTP must contain only digits.' }),
});

export const resetPasswordSchema = z.object({
  email: z
    .string({ error: 'Please enter a valid email address.' })
    .trim()
    .email({ message: 'Please enter a valid email address.' }),
  token: z
    .string({ error: 'Reset token is required.' })
    .trim()
    .min(1, { message: 'Reset token is required.' }),
  newPassword: z
    .string({ error: 'New password is required.' })
    .min(PASSWORD_MIN_LENGTH, {
      message: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
    })
    .max(PASSWORD_MAX_LENGTH, {
      message: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
    }),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetOtpDto = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
