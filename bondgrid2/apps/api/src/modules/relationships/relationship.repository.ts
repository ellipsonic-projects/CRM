import { randomUUID } from 'crypto';

import { getSession } from '../../database/neo4j';
import { Person } from '../people/people.types';
import {
  CanonicalRelationshipId,
  RelationshipRecord,
} from './relationship.types';

export interface RelationshipMutationInput {
  type: CanonicalRelationshipId;
  sourcePersonId: string;
  targetPersonId: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

type RelationshipProperties = Omit<RelationshipRecord, 'metadata'> & {
  metadata: string;
};

export interface RelationshipWithPeople {
  relationship: RelationshipRecord;
  sourcePerson: Person;
  targetPerson: Person;
}

export interface RelationshipCreateCheck {
  sourceExists: boolean;
  targetExists: boolean;
  duplicateExists: boolean;
}

const removeUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;

function parseMetadata(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function toRelationshipRecord(
  properties: RelationshipProperties,
): RelationshipRecord {
  return {
    ...properties,
    metadata: parseMetadata(properties.metadata),
  };
}

function toRelationshipWithPeople(record: unknown): RelationshipWithPeople {
  const entry = record as {
    get: (key: string) => { properties: Record<string, unknown> };
  };

  return {
    relationship: toRelationshipRecord(
      entry.get('relationship').properties as RelationshipProperties,
    ),
    sourcePerson: entry.get('sourcePerson').properties as unknown as Person,
    targetPerson: entry.get('targetPerson').properties as unknown as Person,
  };
}

export class RelationshipRepository {
  async checkCreate(
    organizationId: string,
    data: RelationshipMutationInput,
  ): Promise<RelationshipCreateCheck> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          OPTIONAL MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person {id: $sourcePersonId})
          OPTIONAL MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person {id: $targetPersonId})
          OPTIONAL MATCH (sourcePerson)-[duplicate:RELATED_TO {type: $type}]-(targetPerson)
          RETURN sourcePerson, targetPerson, duplicate
          LIMIT 1
          `,
          {
            organizationId,
            sourcePersonId: data.sourcePersonId,
            targetPersonId: data.targetPersonId,
            type: data.type,
          },
        ),
      );

      const record = result.records[0];

      return {
        sourceExists: Boolean(record?.get('sourcePerson')),
        targetExists: Boolean(record?.get('targetPerson')),
        duplicateExists: Boolean(record?.get('duplicate')),
      };
    } finally {
      await session.close();
    }
  }

  async create(
    organizationId: string,
    data: RelationshipMutationInput,
    createdBy: string,
  ): Promise<RelationshipWithPeople | null> {
    const session = getSession();
    const now = new Date().toISOString();
    const relationship: RelationshipProperties = {
      id: randomUUID(),
      type: data.type,
      sourcePersonId: data.sourcePersonId,
      targetPersonId: data.targetPersonId,
      createdAt: now,
      updatedAt: now,
      createdBy,
      notes: data.notes,
      metadata: JSON.stringify(data.metadata ?? {}),
    };

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person {id: $sourcePersonId})
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person {id: $targetPersonId})
          CREATE (sourcePerson)-[relationship:RELATED_TO]->(targetPerson)
          SET relationship += $relationship
          RETURN relationship, sourcePerson, targetPerson
          LIMIT 1
          `,
          {
            organizationId,
            sourcePersonId: data.sourcePersonId,
            targetPersonId: data.targetPersonId,
            relationship: removeUndefined(relationship),
          },
        ),
      );

      const record = result.records[0];

      return record ? toRelationshipWithPeople(record) : null;
    } finally {
      await session.close();
    }
  }

  async findAllByOrganization(
    organizationId: string,
  ): Promise<RelationshipWithPeople[]> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person)
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person)
          MATCH (sourcePerson)-[relationship:RELATED_TO]->(targetPerson)
          RETURN relationship, sourcePerson, targetPerson
          ORDER BY relationship.createdAt ASC
          `,
          { organizationId },
        ),
      );

      return result.records.map((record) => toRelationshipWithPeople(record));
    } finally {
      await session.close();
    }
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<RelationshipWithPeople | null> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person)
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person)
          MATCH (sourcePerson)-[relationship:RELATED_TO {id: $id}]->(targetPerson)
          RETURN relationship, sourcePerson, targetPerson
          LIMIT 1
          `,
          { organizationId, id },
        ),
      );

      const record = result.records[0];

      return record ? toRelationshipWithPeople(record) : null;
    } finally {
      await session.close();
    }
  }

  async findByPersonId(
    organizationId: string,
    personId: string,
  ): Promise<RelationshipWithPeople[] | null> {
    const session = getSession();

    try {
      return await session.executeRead(async (transaction) => {
        const personResult = await transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(person:Person {id: $personId})
          RETURN person
          LIMIT 1
          `,
          { organizationId, personId },
        );

        if (personResult.records.length === 0) {
          return null;
        }

        const result = await transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person)
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person)
          MATCH (sourcePerson)-[relationship:RELATED_TO]->(targetPerson)
          WHERE sourcePerson.id = $personId OR targetPerson.id = $personId
          RETURN relationship, sourcePerson, targetPerson
          ORDER BY relationship.createdAt ASC
          `,
          { organizationId, personId },
        );

        return result.records.map((record) => toRelationshipWithPeople(record));
      });
    } finally {
      await session.close();
    }
  }

  async duplicateExistsForUpdate(
    organizationId: string,
    relationshipId: string,
    type: CanonicalRelationshipId,
    sourcePersonId: string,
    targetPersonId: string,
  ): Promise<boolean> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person {id: $sourcePersonId})
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person {id: $targetPersonId})
          MATCH (sourcePerson)-[duplicate:RELATED_TO {type: $type}]-(targetPerson)
          WHERE duplicate.id <> $relationshipId
          RETURN duplicate
          LIMIT 1
          `,
          {
            organizationId,
            relationshipId,
            type,
            sourcePersonId,
            targetPersonId,
          },
        ),
      );

      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  async personExists(
    organizationId: string,
    personId: string,
  ): Promise<boolean> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(person:Person {id: $personId})
          RETURN person
          LIMIT 1
          `,
          { organizationId, personId },
        ),
      );

      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  async update(
    organizationId: string,
    id: string,
    data: Partial<RelationshipMutationInput>,
  ): Promise<RelationshipWithPeople | null> {
    const session = getSession();
    const updates = removeUndefined({
      type: data.type,
      targetPersonId: data.targetPersonId,
      sourcePersonId: data.sourcePersonId,
      notes: data.notes,
      metadata:
        data.metadata === undefined ? undefined : JSON.stringify(data.metadata),
      updatedAt: new Date().toISOString(),
    });

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person)
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person)
          MATCH (sourcePerson)-[relationship:RELATED_TO {id: $id}]->(targetPerson)
          OPTIONAL MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(newSourcePerson:Person {id: $sourcePersonId})
          OPTIONAL MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(newTargetPerson:Person {id: $targetPersonId})
          WITH relationship, sourcePerson, targetPerson, newSourcePerson, newTargetPerson, properties(relationship) AS relationshipProperties
          WHERE ($sourcePersonId IS NULL OR newSourcePerson IS NOT NULL)
            AND ($targetPersonId IS NULL OR newTargetPerson IS NOT NULL)
          DELETE relationship
          WITH coalesce(newSourcePerson, sourcePerson) AS resolvedSourcePerson, coalesce(newTargetPerson, targetPerson) AS resolvedTargetPerson, relationshipProperties
          CREATE (resolvedSourcePerson)-[updatedRelationship:RELATED_TO]->(resolvedTargetPerson)
          SET updatedRelationship = relationshipProperties
          SET updatedRelationship += $updates
          SET updatedRelationship.sourcePersonId = resolvedSourcePerson.id
          SET updatedRelationship.targetPersonId = resolvedTargetPerson.id
          RETURN updatedRelationship AS relationship, resolvedSourcePerson AS sourcePerson, resolvedTargetPerson AS targetPerson
          LIMIT 1
          `,
          {
            organizationId,
            id,
            sourcePersonId: data.sourcePersonId ?? null,
            targetPersonId: data.targetPersonId ?? null,
            updates,
          },
        ),
      );

      const record = result.records[0];

      return record ? toRelationshipWithPeople(record) : null;
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
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(sourcePerson:Person)
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(targetPerson:Person)
          MATCH (sourcePerson)-[relationship:RELATED_TO {id: $id}]->(targetPerson)
          WITH relationship
          DELETE relationship
          RETURN count(relationship) AS deleted
          `,
          { organizationId, id },
        ),
      );

      const deleted = result.records[0]?.get('deleted');

      if (
        deleted &&
        typeof deleted === 'object' &&
        'toNumber' in deleted &&
        typeof deleted.toNumber === 'function'
      ) {
        return deleted.toNumber() > 0;
      }

      return Number(deleted ?? 0) > 0;
    } finally {
      await session.close();
    }
  }
}
