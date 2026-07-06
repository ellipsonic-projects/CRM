const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_PERSON'
  | 'UPDATE_PERSON'
  | 'DELETE_PERSON'
  | 'CREATE_RELATIONSHIP'
  | 'UPDATE_RELATIONSHIP'
  | 'DELETE_RELATIONSHIP'
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'CREATE_USER'
  | 'UPDATE_USER_ROLE'
  | 'UPDATE_ORGANIZATION'
  | 'DELETE_ORGANIZATION';

export type AuditEntity =
  | 'Auth'
  | 'Person'
  | 'Relationship'
  | 'Event'
  | 'User'
  | 'Organization';

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  entityName?: string;
  summary: string;
  createdAt: string;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  entity?: string;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Request failed' : payload.error);
  }

  return payload.data;
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLog[]> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.action) {
    params.set('action', filters.action);
  }

  if (filters.entity) {
    params.set('entity', filters.entity);
  }

  const query = params.toString();

  return request<AuditLog[]>(`/api/v1/audit${query ? `?${query}` : ''}`);
}
