import { AuditRepository } from './audit.repository';
import { AuditLog, CreateAuditLogInput, ListAuditLogsQuery } from './audit.types';

export class AuditService {
  constructor(private readonly repository = new AuditRepository()) {}

  async record(input: CreateAuditLogInput): Promise<void> {
    await this.repository.create(input);
  }

  async list(
    organizationId: string,
    query: ListAuditLogsQuery,
  ): Promise<AuditLog[]> {
    return this.repository.findAllByOrganization(organizationId, query);
  }
}

export async function recordAudit(input: CreateAuditLogInput): Promise<void> {
  try {
    await new AuditService().record(input);
  } catch (error) {
    console.error('Could not record audit log', error);
  }
}
