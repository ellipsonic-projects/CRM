import { randomUUID } from 'crypto';
import { getSession } from '../../database/neo4j';
import { AdminSignupDto } from './auth.schema';
import { AuthUser, Role, User } from './auth.types';

interface CreateAdminInput {
  data: AdminSignupDto;
  passwordHash: string;
}

interface StoredUser extends User {
  organizationId: string;
}

const removeUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;

export class AuthRepository {
  async findUserByEmailOrPhone(identifier: string): Promise<StoredUser | null> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (organization:Organization)-[:HAS_USER]->(user:User)
          WHERE toLower(user.email) = toLower($identifier)
             OR user.phone = $identifier
          RETURN user, organization.id AS organizationId
          LIMIT 1
          `,
          { identifier },
        ),
      );

      const record = result.records[0];

      if (!record) {
        return null;
      }

      return {
        ...(record.get('user').properties as User),
        organizationId: record.get('organizationId') as string,
      };
    } finally {
      await session.close();
    }
  }

  async findAuthUserById(userId: string): Promise<AuthUser | null> {
    const session = getSession();

    try {
      const result = await session.executeRead((transaction) =>
        transaction.run(
          `
          MATCH (organization:Organization)-[:HAS_USER]->(user:User {id: $userId})
          RETURN user, organization.id AS organizationId
          LIMIT 1
          `,
          { userId },
        ),
      );

      const record = result.records[0];

      if (!record) {
        return null;
      }

      const user = record.get('user').properties as User;

      return {
        userId: user.id,
        organizationId: record.get('organizationId') as string,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      };
    } finally {
      await session.close();
    }
  }

  async createAdminWithOrganization({
    data,
    passwordHash,
  }: CreateAdminInput): Promise<AuthUser> {
    const session = getSession();
    const now = new Date().toISOString();

    const organization = removeUndefined({
      id: randomUUID(),
      name: data.organization.name,
      organizationType: data.organization.organizationType,
      state: data.organization.state,
      city: data.organization.city,
      area: data.organization.area,
      logo: data.organization.logo,
      createdAt: now,
      updatedAt: now,
    });

    const user: User = {
      id: randomUUID(),
      fullName: data.admin.fullName,
      email: data.admin.email.toLowerCase(),
      phone: data.admin.phone,
      passwordHash,
      role: 'ADMIN',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await session.executeWrite((transaction) =>
        transaction.run(
          `
          MATCH (existingUser:User)
          WHERE toLower(existingUser.email) = toLower($email)
             OR existingUser.phone = $phone
          WITH count(existingUser) AS existingUsers
          WHERE existingUsers = 0
          CREATE (organization:Organization)
          SET organization += $organization
          CREATE (user:User)
          SET user += $user
          CREATE (organization)-[:HAS_USER]->(user)
          RETURN user, organization.id AS organizationId
          `,
          {
            email: user.email,
            phone: user.phone,
            organization,
            user,
          },
        ),
      );

      const record = result.records[0];

      if (!record) {
        throw new Error('A user with this email or phone already exists.');
      }

      const createdUser = record.get('user').properties as User;

      return {
        userId: createdUser.id,
        organizationId: record.get('organizationId') as string,
        role: createdUser.role as Role,
        fullName: createdUser.fullName,
        email: createdUser.email,
        phone: createdUser.phone,
      };
    } finally {
      await session.close();
    }
  }
}
