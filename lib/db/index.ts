import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/workflow';

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/workflow';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
