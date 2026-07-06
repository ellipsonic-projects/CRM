const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface Organization {
  id: string;
  name: string;
  organizationType: string;
  phone?: string;
  email?: string;
  state: string;
  city?: string;
  area?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  organizationType: string;
  phone?: string;
  email?: string;
  state: string;
  city?: string;
  area?: string;
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

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success ? 'Request failed' : getErrorMessage(payload),
    );
  }

  return payload.data;
}

export async function getOrganization(id: string): Promise<Organization> {
  return request<Organization>(`/api/v1/organizations/${id}`);
}

export async function createOrganization(
  data: CreateOrganizationInput,
): Promise<Organization> {
  return request<Organization>('/api/v1/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrganization(
  data: Partial<CreateOrganizationInput>,
): Promise<Organization> {
  return request<Organization>('/api/v1/organizations/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteOrganization(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/organizations/me`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Could not delete organization.');
  }
}
