import { sql } from "drizzle-orm";

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      owner_id UUID NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      is_public BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS workflow_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID NOT NULL REFERENCES workflows(id),
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      position JSONB NOT NULL,
      config JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workflow_connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID NOT NULL REFERENCES workflows(id),
      source_step_id UUID NOT NULL REFERENCES workflow_steps(id),
      target_step_id UUID NOT NULL REFERENCES workflow_steps(id),
      source_handle TEXT NOT NULL,
      target_handle TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workflow_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workflow_id UUID NOT NULL REFERENCES workflows(id),
      status TEXT NOT NULL,
      input JSONB NOT NULL,
      output JSONB,
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      error TEXT
    );
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    DROP TABLE IF EXISTS workflow_executions;
    DROP TABLE IF EXISTS workflow_connections;
    DROP TABLE IF EXISTS workflow_steps;
    DROP TABLE IF EXISTS workflows;
  `);
} 