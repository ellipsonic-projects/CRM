export type Role = 'ADMIN' | 'VOLUNTEER' | 'VIEWER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  userId: string;
  organizationId: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
