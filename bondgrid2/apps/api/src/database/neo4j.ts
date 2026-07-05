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

  console.log("✅ Connected to Neo4j AuraDB");
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