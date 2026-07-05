import { randomUUID } from 'crypto';
import neo4j from 'neo4j-driver';
import { getSession } from '../../database/neo4j';
import {
  CreatePersonDto,
  ListPeopleQueryDto,
  UpdatePersonDto,
} from './people.schema';
import { PaginatedPeople, Person } from './people.types';

type PersonImageMetadata = {
  profilePictureUrl?: string;
  profilePicturePublicId?: string;
};

type CreatePersonInput = CreatePersonDto & PersonImageMetadata;
type UpdatePersonInput = UpdatePersonDto & PersonImageMetadata;

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

export class PeopleRepository {
  async create(
    organizationId: string,
    data: CreatePersonInput,
  ): Promise<Person | null> {
    const session = getSession();

    const person = removeUndefined<Person>({
      id: randomUUID(),
      organizationId,

      fullName: data.fullName,

      phone: data.phone,
      email: data.email,

      gender: data.gender,

      occupation: data.occupation,

      state: data.state,
      city: data.city,
      area: data.area,

      notes: data.notes,

      profilePicture: data.profilePicture,
      profilePictureUrl: data.profilePictureUrl,
      profilePicturePublicId: data.profilePicturePublicId,

      hasLogin: data.hasLogin ?? false,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (o:Organization {id: $organizationId})

          CREATE (p:Person)

          SET p += $person

          CREATE (o)-[:HAS_PERSON]->(p)

          RETURN p
          `,
          {
            organizationId,
            person,
          },
        ),
      );

      if (result.records.length === 0) {
        return null;
      }

      return person;
    } finally {
      await session.close();
    }
  }

  async findAllByOrganization(
    organizationId: string,
    params: ListPeopleQueryDto,
  ): Promise<PaginatedPeople | null> {
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
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(person:Person)
          RETURN person
          ORDER BY person.fullName ASC
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
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(person:Person)
          RETURN count(person) AS total
          `,
          {
            organizationId,
          },
        );

        return {
          people: listResult.records.map(
            (record) => record.get('person').properties as Person,
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

  async findById(organizationId: string, id: string): Promise<Person | null> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(person:Person {id: $id})
          RETURN person
          LIMIT 1
          `,
          { organizationId, id },
        ),
      );

      const record = result.records[0];

      if (!record) {
        return null;
      }

      return record.get('person').properties as Person;
    } finally {
      await session.close();
    }
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdatePersonInput,
  ): Promise<Person | null> {
    const session = getSession();
    const updates = removeUndefined({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(person:Person {id: $id})
          SET person += $updates
          RETURN person
          LIMIT 1
          `,
          { organizationId, id, updates },
        ),
      );

      const record = result.records[0];

      if (!record) {
        return null;
      }

      return record.get('person').properties as Person;
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
          MATCH (:Organization {id: $organizationId})-[:HAS_PERSON]->(person:Person {id: $id})
          WITH person
          DETACH DELETE person
          RETURN count(person) AS deleted
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
