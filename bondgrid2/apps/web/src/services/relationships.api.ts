const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

import { Person } from './people.api';

export type CanonicalRelationshipType =
  | 'PARENT_CHILD'
  | 'SPOUSE'
  | 'SIBLING'
  | 'FRIEND'
  | 'MENTOR'
  | 'TEACHER'
  | 'COLLEAGUE'
  | 'NEIGHBOUR'
  | 'COUSIN'
  | 'GRANDPARENT'
  | 'AUNT_UNCLE'
  | 'CUSTOM';

export interface RelationshipTypeOption {
  id: string;
  label: string;
  group?: 'Family' | 'Professional' | 'Social' | 'Community' | 'Custom';
  canonicalId?: CanonicalRelationshipType;
  perspective?: 'source' | 'target';
  directional: boolean;
  symmetric: boolean;
}

export interface Relationship {
  id: string;
  type: CanonicalRelationshipType;
  sourcePersonId: string;
  targetPersonId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
  metadata: Record<string, unknown>;
  displayLabel: string;
  filterLabel: string;
  direction: 'OUTGOING' | 'INCOMING';
  sourcePerson: Person;
  targetPerson: Person;
  relatedPerson: Person;
}

export interface CreateRelationshipInput {
  relationshipOptionId?: string;
  selectedPersonId?: string;
  relatedPersonId?: string;
  type?: CanonicalRelationshipType;
  sourcePersonId?: string;
  targetPersonId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateRelationshipInput {
  relationshipOptionId?: string;
  selectedPersonId?: string;
  relatedPersonId?: string;
  type?: CanonicalRelationshipType;
  sourcePersonId?: string;
  targetPersonId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
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

export async function getRelationshipTypes(): Promise<
  RelationshipTypeOption[]
> {
  return request<RelationshipTypeOption[]>('/api/v1/relationships/types');
}

export async function getRelationships(): Promise<Relationship[]> {
  return request<Relationship[]>('/api/v1/relationships');
}

export async function getPersonRelationships(
  personId: string,
): Promise<Relationship[]> {
  return request<Relationship[]>(`/api/v1/people/${personId}/relationships`);
}

export async function createRelationship(
  data: CreateRelationshipInput,
): Promise<Relationship> {
  return request<Relationship>('/api/v1/relationships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRelationship(
  id: string,
  data: UpdateRelationshipInput,
): Promise<Relationship> {
  return request<Relationship>(`/api/v1/relationships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRelationship(id: string): Promise<void> {
  await request<void>(`/api/v1/relationships/${id}`, {
    method: 'DELETE',
  });
}
