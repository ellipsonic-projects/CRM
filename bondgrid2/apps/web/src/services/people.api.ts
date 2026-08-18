const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string;
  organizationId: string;
  personId?: string;
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
  profilePictureUrl?: string;
  profilePicturePublicId?: string;
  hasLogin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonInput {
  personId?: string;
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
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers = isFormData
    ? init?.headers
    : {
        'Content-Type': 'application/json',
        ...init?.headers,
      };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
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

function appendOptionalFormValue(
  formData: FormData,
  key: string,
  value: string | boolean | undefined,
): void {
  if (value === undefined) {
    return;
  }

  formData.append(key, String(value));
}

function toPersonFormData(
  data: CreatePersonInput | UpdatePersonInput,
  profilePicture: File,
): FormData {
  const formData = new FormData();

  appendOptionalFormValue(formData, 'personId', (data as CreatePersonInput).personId);
  appendOptionalFormValue(formData, 'fullName', data.fullName);
  appendOptionalFormValue(formData, 'phone', data.phone);
  appendOptionalFormValue(formData, 'email', data.email);
  appendOptionalFormValue(formData, 'gender', data.gender);
  appendOptionalFormValue(formData, 'occupation', data.occupation);
  appendOptionalFormValue(formData, 'state', data.state);
  appendOptionalFormValue(formData, 'city', data.city);
  appendOptionalFormValue(formData, 'area', data.area);
  appendOptionalFormValue(formData, 'notes', data.notes);
  appendOptionalFormValue(formData, 'hasLogin', data.hasLogin);
  formData.append('profilePicture', profilePicture);

  return formData;
}

export async function createPerson(
  data: CreatePersonInput,
  profilePicture?: File,
): Promise<Person> {
  if (!profilePicture) {
    return request<Person>('/api/v1/people', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  return request<Person>('/api/v1/people', {
    method: 'POST',
    body: toPersonFormData(data, profilePicture),
  });
}

export async function updatePerson(
  id: string,
  data: UpdatePersonInput,
  profilePicture?: File,
): Promise<Person> {
  if (!profilePicture) {
    return request<Person>(`/api/v1/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  return request<Person>(`/api/v1/people/${id}`, {
    method: 'PATCH',
    body: toPersonFormData(data, profilePicture),
  });
}

export async function deletePerson(id: string): Promise<void> {
  await request<void>(`/api/v1/people/${id}`, {
    method: 'DELETE',
  });
}
