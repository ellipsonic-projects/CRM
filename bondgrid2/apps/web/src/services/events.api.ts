const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export type StoredEventStatus = 'Cancelled';
export type EventCategory =
  | 'Religious'
  | 'Social'
  | 'Community'
  | 'Educational'
  | 'Meeting'
  | 'Personal'
  | 'Other';

export interface Event {
  id: string;
  title: string;
  description?: string;
  category?: EventCategory;
  startDateTime: string;
  endDateTime?: string;
  location?: string;
  status: EventStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  organizationId: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category?: EventCategory;
  startDateTime: string;
  endDateTime?: string;
  location?: string;
  status?: StoredEventStatus;
  notes?: string;
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, 'status'>> & {
  status?: StoredEventStatus | null;
};

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

export async function getEvents(): Promise<Event[]> {
  return request<Event[]>('/api/v1/events');
}

export async function createEvent(data: CreateEventInput): Promise<Event> {
  return request<Event>('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(
  id: string,
  data: UpdateEventInput,
): Promise<Event> {
  return request<Event>(`/api/v1/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await request<void>(`/api/v1/events/${id}`, {
    method: 'DELETE',
  });
}
