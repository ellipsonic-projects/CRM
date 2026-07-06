import { getSession } from '../../database/neo4j';
import { AuditLog } from '../audit';
import { Event, EventNode, EventStatus } from '../events';
import { DashboardSummary } from './dashboard.types';

const toNumber = (value: unknown): number => {
  if (
    value &&
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  ) {
    return value.toNumber();
  }

  return Number(value);
};

const deriveStatus = (event: EventNode): EventStatus => {
  if (event.status === 'Cancelled') {
    return 'Cancelled';
  }

  const now = Date.now();
  const startsAt = new Date(event.startDateTime).getTime();
  const endsAt = event.endDateTime
    ? new Date(event.endDateTime).getTime()
    : undefined;

  if (now < startsAt) {
    return 'Upcoming';
  }

  if (endsAt !== undefined && now > endsAt) {
    return 'Completed';
  }

  return 'Ongoing';
};

const toEvent = (properties: EventNode): Event => ({
  ...properties,
  status: deriveStatus(properties),
});

export class DashboardRepository {
  async getSummary(organizationId: string): Promise<DashboardSummary> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (organization:Organization {id: $organizationId})
          OPTIONAL MATCH (organization)-[:HAS_PERSON]->(person:Person)
          WITH organization, count(DISTINCT person) AS totalPeople
          OPTIONAL MATCH (organization)-[:HAS_EVENT]->(event:Event)
          WITH organization, totalPeople, count(DISTINCT event) AS totalEvents
          OPTIONAL MATCH (organization)-[:HAS_USER]->(user:User)
          WITH organization, totalPeople, totalEvents, count(DISTINCT user) AS totalUsers
          OPTIONAL MATCH (organization)-[:HAS_PERSON]->(sourcePerson:Person)-[relationship:RELATED_TO]->(:Person)<-[:HAS_PERSON]-(organization)
          RETURN totalPeople, totalEvents, totalUsers, count(DISTINCT relationship) AS totalRelationships
          LIMIT 1
          `,
          { organizationId },
        ),
      );

      const record = result.records[0];

      return {
        totalPeople: toNumber(record?.get('totalPeople') ?? 0),
        totalRelationships: toNumber(record?.get('totalRelationships') ?? 0),
        totalEvents: toNumber(record?.get('totalEvents') ?? 0),
        totalUsers: toNumber(record?.get('totalUsers') ?? 0),
      };
    } finally {
      await session.close();
    }
  }

  async getRecentActivity(organizationId: string): Promise<AuditLog[]> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_AUDIT_LOG]->(auditLog:AuditLog)
          RETURN auditLog
          ORDER BY auditLog.createdAt DESC
          LIMIT 8
          `,
          { organizationId },
        ),
      );

      return result.records.map(
        (record) => record.get('auditLog').properties as AuditLog,
      );
    } finally {
      await session.close();
    }
  }

  async getUpcomingEvents(organizationId: string): Promise<Event[]> {
    const session = getSession();
    const now = new Date().toISOString();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_EVENT]->(event:Event)
          WHERE event.startDateTime >= $now
            AND (event.status IS NULL OR event.status <> 'Cancelled')
          RETURN event
          ORDER BY event.startDateTime ASC
          LIMIT 6
          `,
          { organizationId, now },
        ),
      );

      return result.records.map((record) =>
        toEvent(record.get('event').properties as EventNode),
      );
    } finally {
      await session.close();
    }
  }
}
