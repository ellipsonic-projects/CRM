import neo4j, { Driver, Session } from "neo4j-driver";
import { env } from "../config/env";
let driver: Driver;

export async function connectNeo4j(): Promise<void> {
  driver = neo4j.driver(
    env.neo4j.uri,
    neo4j.auth.basic(
      env.neo4j.username,
      env.neo4j.password
    )
  );

  await driver.verifyConnectivity();
  await initializeDatabaseSchema();

  console.log("✅ Connected to Neo4j AuraDB");
}

export async function initializeDatabaseSchema(): Promise<void> {
  if (!driver) {
    return;
  }

  const session = driver.session({
    database: env.neo4j.database,
  });

  try {
    // 1. Uniqueness constraint for Person.personId
    await session.run(`
      CREATE CONSTRAINT person_personId_unique IF NOT EXISTS
      FOR (p:Person)
      REQUIRE p.personId IS UNIQUE
    `);

    // 2. Uniqueness constraint for Person.id
    await session.run(`
      CREATE CONSTRAINT person_id_unique IF NOT EXISTS
      FOR (p:Person)
      REQUIRE p.id IS UNIQUE
    `);

    // 3. Uniqueness constraint for Organization.id
    await session.run(`
      CREATE CONSTRAINT organization_id_unique IF NOT EXISTS
      FOR (o:Organization)
      REQUIRE o.id IS UNIQUE
    `);

    // 4. Uniqueness constraint for SequenceCounter.name
    await session.run(`
      CREATE CONSTRAINT sequence_counter_name_unique IF NOT EXISTS
      FOR (s:SequenceCounter)
      REQUIRE s.name IS UNIQUE
    `);

    // 5. Initialize or sync Person SequenceCounter to current max personId
    const maxExistingResult = await session.run(`
      MATCH (p:Person)
      WHERE p.personId IS NOT NULL AND p.personId STARTS WITH 'P'
      RETURN p.personId AS personId
    `);

    let highestExisting = 0;
    for (const record of maxExistingResult.records) {
      const rawId = String(record.get('personId') || '');
      const match = rawId.match(/^P(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestExisting) {
          highestExisting = num;
        }
      }
    }

    // 6. Safely backfill personId for any existing Person nodes that lack personId
    const missingResult = await session.run(`
      MATCH (p:Person)
      WHERE p.personId IS NULL
      RETURN p.id AS id, p.createdAt AS createdAt
      ORDER BY p.createdAt ASC, p.id ASC
    `);

    if (missingResult.records.length > 0) {
      for (const record of missingResult.records) {
        const id = record.get('id') as string;
        highestExisting += 1;
        const newPersonId = `P${String(highestExisting).padStart(6, '0')}`;

        await session.run(
          `
          MATCH (p:Person {id: $id})
          WHERE p.personId IS NULL
          SET p.personId = $personId
          `,
          { id, personId: newPersonId }
        );
      }
    }

    // Initialize or update the SequenceCounter to highestExisting
    await session.run(
      `
      MERGE (c:SequenceCounter {name: 'Person'})
      ON CREATE SET c.currentValue = $highestExisting
      ON MATCH SET c.currentValue = CASE WHEN c.currentValue < $highestExisting THEN $highestExisting ELSE c.currentValue END
      `,
      { highestExisting: neo4j.int(highestExisting) }
    );
  } catch (error) {
    console.error('⚠️ Warning: Neo4j schema initialization encountered an issue:', error);
  } finally {
    await session.close();
  }
}

export function getSession(): Session {
  if (!driver) {
    throw new Error("Neo4j driver has not been initialized.");
  }

  return driver.session({
    database: env.neo4j.database,
  });
}

export async function closeNeo4j(): Promise<void> {
  if (driver) {
    await driver.close();
  }
}