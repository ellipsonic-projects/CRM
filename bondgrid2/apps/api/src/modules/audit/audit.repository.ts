import { randomUUID } from 'crypto';
import { getSession } from '../../database/neo4j';
import { AuditLog, CreateAuditLogInput, ListAuditLogsQuery } from './audit.types';

const removeUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;

export class AuditRepository {
  async create(input: CreateAuditLogInput): Promise<AuditLog | null> {
    const session = getSession();
    const auditLog = removeUndefined<AuditLog>({
      id: randomUUID(),
      organizationId: input.organizationId,
      userId: input.userId,
      userName: input.userName ?? 'System',
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      entityName: input.entityName,
      summary: input.summary,
      createdAt: new Date().toISOString(),
    });

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (organization:Organization {id: $organizationId})
          CREATE (auditLog:AuditLog)
          SET auditLog += $auditLog
          CREATE (organization)-[:HAS_AUDIT_LOG]->(auditLog)
          RETURN auditLog
          `,
          { organizationId: input.organizationId, auditLog },
        ),
      );

      const record = result.records[0];

      return record
        ? (record.get('auditLog').properties as AuditLog)
        : null;
    } finally {
      await session.close();
    }
  }

  async findAllByOrganization(
    organizationId: string,
    query: ListAuditLogsQuery,
  ): Promise<AuditLog[]> {
    const session = getSession();
    const search = query.search?.trim().toLowerCase();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_AUDIT_LOG]->(auditLog:AuditLog)
          WHERE ($action IS NULL OR auditLog.action = $action)
            AND ($entity IS NULL OR auditLog.entity = $entity)
            AND (
              $search IS NULL
              OR toLower(auditLog.userName) CONTAINS $search
              OR toLower(auditLog.action) CONTAINS $search
              OR toLower(auditLog.entity) CONTAINS $search
              OR toLower(coalesce(auditLog.entityName, '')) CONTAINS $search
              OR toLower(auditLog.summary) CONTAINS $search
            )
          RETURN auditLog
          ORDER BY auditLog.createdAt DESC
          LIMIT 200
          `,
          {
            organizationId,
            action: query.action ?? null,
            entity: query.entity ?? null,
            search: search && search.length > 0 ? search : null,
          },
        ),
      );

      return result.records.map(
        (record) => record.get('auditLog').properties as AuditLog,
      );
    } finally {
      await session.close();
    }
  }
}
