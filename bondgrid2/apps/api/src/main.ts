import app from "./app";
import { env } from "./config/env";
import { closeNeo4j, connectNeo4j } from "./database/neo4j";

async function bootstrap() {
  const server = app.listen(env.port, (error?: Error) => {
    if (error) {
      console.error("Failed to start API server");
      console.error(error);
      process.exit(1);
    }

    console.log(`API running on http://localhost:${env.port}`);
  });

  try {
    await connectNeo4j();
  } catch (error) {
    console.error("Failed to connect to Neo4j");
    console.error(error);
  }

  const shutdown = async () => {
    try {
      await closeNeo4j();
    } finally {
      server.close(() => process.exit(0));
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap();
