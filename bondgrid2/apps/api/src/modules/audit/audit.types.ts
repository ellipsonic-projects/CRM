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

export interface CreateAuditLogInput {
  organizationId: string;
  userId: string;
  userName?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  entityName?: string;
  summary: string;
}

export interface ListAuditLogsQuery {
  search?: string;
  action?: AuditAction;
  entity?: AuditEntity;
}
