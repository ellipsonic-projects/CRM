const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type Role = 'ADMIN' | 'VOLUNTEER' | 'VIEWER';

export interface AuthUser {
  userId: string;
  organizationId: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface AdminSignupInput {
  admin: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  };
  organization: {
    name: string;
    organizationType:
      | 'Temple'
      | 'Trust'
      | 'NGO'
      | 'Community'
      | 'Association'
      | 'Educational Institution'
      | 'Other';
    state: string;
    city: string;
    area?: string;
    logo?: string;
  };
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string;
  details?: unknown;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

function getErrorMessage(payload: ApiFailure): string {
  if (Array.isArray(payload.details)) {
    const messages = payload.details
      .map((detail) => {
        if (
          detail &&
          typeof detail === 'object' &&
          'message' in detail &&
          typeof detail.message === 'string'
        ) {
          return detail.message;
        }

        return undefined;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.length === 1
        ? messages[0]
        : messages.map((message) => `- ${message}`).join('\n');
    }
  }

  return payload.error || 'Request failed';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success ? 'Request failed' : getErrorMessage(payload),
    );
  }

  return payload.data;
}

export async function login(data: LoginInput): Promise<AuthUser> {
  return request<AuthUser>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminSignup(data: AdminSignupInput): Promise<AuthUser> {
  return request<AuthUser>('/api/v1/auth/admin-signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/api/v1/auth/me');
}

export async function getUsers(): Promise<User[]> {
  return request<User[]>('/api/v1/auth/users');
}

export async function createUser(data: CreateUserInput): Promise<User> {
  return request<User>('/api/v1/auth/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<User> {
  return request<User>(`/api/v1/auth/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function logout(): Promise<void> {
  await request<void>('/api/v1/auth/logout', {
    method: 'POST',
  });
}
