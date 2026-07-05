const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string;
  organizationId: string;
  fullName: string;
  phone?: string;
  email?: string;
  gender: Gender;
  occupation?: string;
  state: string;
  city?: string;
  area?: string;
  notes?: string;
  profilePicture?: string;
  hasLogin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonInput {
  fullName: string;
  phone?: string;
  email?: string;
  gender: Gender;
  occupation?: string;
  state: string;
  city?: string;
  area?: string;
  notes?: string;
  profilePicture?: string;
  hasLogin?: boolean;
}

export type UpdatePersonInput = Partial<
  Omit<CreatePersonInput, 'organizationId'>
>;

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

export async function getPeople(): Promise<Person[]> {
  return request<Person[]>('/api/v1/people');
}

export async function createPerson(data: CreatePersonInput): Promise<Person> {
  return request<Person>('/api/v1/people', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePerson(
  id: string,
  data: UpdatePersonInput,
): Promise<Person> {
  return request<Person>(`/api/v1/people/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePerson(id: string): Promise<void> {
  await request<void>(`/api/v1/people/${id}`, {
    method: 'DELETE',
  });
}
