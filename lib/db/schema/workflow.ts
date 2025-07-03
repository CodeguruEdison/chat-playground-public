import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
});

export const workflowSteps = pgTable('workflow_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .references(() => workflows.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  position: jsonb('position').notNull(),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workflowConnections = pgTable('workflow_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .references(() => workflows.id)
    .notNull(),
  sourceStepId: uuid('source_step_id')
    .references(() => workflowSteps.id)
    .notNull(),
  targetStepId: uuid('target_step_id')
    .references(() => workflowSteps.id)
    .notNull(),
  sourceHandle: text('source_handle').notNull(),
  targetHandle: text('target_handle').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .references(() => workflows.id)
    .notNull(),
  status: text('status').notNull(),
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
});

// Relations
export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  owner: one(users, {
    fields: [workflows.ownerId],
    references: [users.id],
  }),
  steps: many(workflowSteps),
  connections: many(workflowConnections),
  executions: many(workflowExecutions),
}));

export const workflowStepsRelations = relations(
  workflowSteps,
  ({ one, many }) => ({
    workflow: one(workflows, {
      fields: [workflowSteps.workflowId],
      references: [workflows.id],
    }),
    sourceConnections: many(workflowConnections, {
      relationName: 'sourceStep',
    }),
    targetConnections: many(workflowConnections, {
      relationName: 'targetStep',
    }),
  }),
);

export const workflowConnectionsRelations = relations(
  workflowConnections,
  ({ one }) => ({
    workflow: one(workflows, {
      fields: [workflowConnections.workflowId],
      references: [workflows.id],
    }),
    sourceStep: one(workflowSteps, {
      fields: [workflowConnections.sourceStepId],
      references: [workflowSteps.id],
      relationName: 'sourceStep',
    }),
    targetStep: one(workflowSteps, {
      fields: [workflowConnections.targetStepId],
      references: [workflowSteps.id],
      relationName: 'targetStep',
    }),
  }),
);
