import { randomUUID } from 'crypto';
import { getSession } from '../../database/neo4j';
import { CreateOrganizationDto } from './organization.schema';
import { Organization } from './organization.types';

const removeUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;

export class OrganizationRepository {
  async create(data: CreateOrganizationDto): Promise<Organization> {
    const session = getSession();
    const now = new Date().toISOString();

    const organization = removeUndefined<Organization>({
      id: randomUUID(),
      name: data.name,
      organizationType: data.organizationType,
      phone: data.phone,
      email: data.email,
      state: data.state,
      city: data.city,
      area: data.area,
      createdAt: now,
      updatedAt: now,
    });

    try {
      const result = await session.run(
        `
        CREATE (organization:Organization)
        SET organization += $organization
        RETURN organization
        `,
        { organization },
      );

      return result.records[0].get('organization').properties as Organization;
    } finally {
      await session.close();
    }
  }

  async findById(id: string): Promise<Organization | null> {
    const session = getSession();

    try {
      const result = await session.run(
        `
        MATCH (organization:Organization {id: $id})
        RETURN organization
        LIMIT 1
        `,
        { id },
      );

      const record = result.records[0];

      if (!record) {
        return null;
      }

      return record.get('organization').properties as Organization;
    } finally {
      await session.close();
    }
  }
}
