import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as workflowMigration from './migrations/0001_workflow';

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/workflow';

async function main() {
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Running migrations...');

  try {
    await workflowMigration.up(db);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }

  await sql.end();
}

main();
