import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),

  nodeEnv: process.env.NODE_ENV ?? 'development',

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4000',

  jwtSecret: required('JWT_SECRET'),

  neo4j: {
    uri: process.env.NEO4J_URI ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
    database: process.env.NEO4J_DATABASE ?? 'neo4j',
  },
};
