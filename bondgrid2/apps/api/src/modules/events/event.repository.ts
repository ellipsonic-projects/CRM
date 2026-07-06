import { randomUUID } from 'crypto';
import neo4j from 'neo4j-driver';
import { getSession } from '../../database/neo4j';
import {
  CreateEventDto,
  ListEventsQueryDto,
  UpdateEventDto,
} from './event.schema';
import { Event, EventNode, EventStatus, PaginatedEvents } from './event.types';

const removeUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;

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

const toPositiveInteger = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
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

export class EventRepository {
  async create(
    organizationId: string,
    createdBy: string,
    data: CreateEventDto,
  ): Promise<Event | null> {
    const session = getSession();
    const now = new Date().toISOString();

    const event = removeUndefined<EventNode>({
      id: randomUUID(),
      title: data.title,
      description: data.description,
      category: data.category,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      location: data.location,
      status: data.status,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
      createdBy,
      organizationId,
    });

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (organization:Organization {id: $organizationId})
          CREATE (event:Event)
          SET event += $event
          CREATE (organization)-[:HAS_EVENT]->(event)
          RETURN event
          `,
          {
            organizationId,
            event,
          },
        ),
      );

      if (result.records.length === 0) {
        return null;
      }

      return toEvent(result.records[0].get('event').properties as EventNode);
    } finally {
      await session.close();
    }
  }

  async findAllByOrganization(
    organizationId: string,
    params: ListEventsQueryDto,
  ): Promise<PaginatedEvents | null> {
    const session = getSession();
    const page = toPositiveInteger(params.page, 1);
    const limit = Math.min(toPositiveInteger(params.limit, 20), 100);
    const skip = Math.trunc((page - 1) * limit);

    try {
      return await session.executeRead(async (transaction) => {
        const organizationResult = await transaction.run(
          `
          MATCH (organization:Organization {id: $organizationId})
          RETURN organization
          LIMIT 1
          `,
          { organizationId },
        );

        if (organizationResult.records.length === 0) {
          return null;
        }

        const listResult = await transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_EVENT]->(event:Event)
          RETURN event
          ORDER BY event.startDateTime ASC, event.createdAt DESC
          SKIP $skip
          LIMIT $limit
          `,
          {
            organizationId,
            skip: neo4j.int(skip),
            limit: neo4j.int(limit),
          },
        );

        const countResult = await transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_EVENT]->(event:Event)
          RETURN count(event) AS total
          `,
          { organizationId },
        );

        return {
          events: listResult.records.map((record) =>
            toEvent(record.get('event').properties as EventNode),
          ),
          page,
          limit,
          total: toNumber(countResult.records[0].get('total')),
        };
      });
    } finally {
      await session.close();
    }
  }

  async findById(organizationId: string, id: string): Promise<Event | null> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_EVENT]->(event:Event {id: $id})
          RETURN event
          LIMIT 1
          `,
          { organizationId, id },
        ),
      );

      const record = result.records[0];

      if (!record) {
        return null;
      }

      return toEvent(record.get('event').properties as EventNode);
    } finally {
      await session.close();
    }
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateEventDto,
  ): Promise<Event | null> {
    const session = getSession();
    const updates = removeUndefined({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_EVENT]->(event:Event {id: $id})
          SET event += $updates
          RETURN event
          LIMIT 1
          `,
          { organizationId, id, updates },
        ),
      );

      const record = result.records[0];

      if (!record) {
        return null;
      }

      return toEvent(record.get('event').properties as EventNode);
    } finally {
      await session.close();
    }
  }

  async delete(organizationId: string, id: string): Promise<boolean> {
    const session = getSession();

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_EVENT]->(event:Event {id: $id})
          WITH event
          DETACH DELETE event
          RETURN count(event) AS deleted
          `,
          { organizationId, id },
        ),
      );

      const deleted = result.records[0]?.get('deleted');

      return toNumber(deleted ?? 0) > 0;
    } finally {
      await session.close();
    }
  }
}
