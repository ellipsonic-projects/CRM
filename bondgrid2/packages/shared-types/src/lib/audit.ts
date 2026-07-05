import { BaseEntity } from "./common";

export interface AuditLog extends BaseEntity {
  userId: string;

  action: string;

  entity: string;

  entityId: string;
}