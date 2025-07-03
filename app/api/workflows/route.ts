import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  workflows,
  workflowSteps,
  workflowConnections,
} from '@/lib/db/schema/workflow';

export async function GET() {
  try {
    const allWorkflows = await db.query.workflows.findMany({
      with: {
        steps: true,
        connections: true,
      },
    });
    return NextResponse.json(allWorkflows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, steps, connections } = body;

    const workflow = await db.transaction(async (tx) => {
      // Create workflow
      const [newWorkflow] = await tx
        .insert(workflows)
        .values({
          name,
          description,
          ownerId: '1', // TODO: Get from auth
        })
        .returning();

      // Create steps
      const createdSteps = await Promise.all(
        steps.map((step: any) =>
          tx
            .insert(workflowSteps)
            .values({
              workflowId: newWorkflow.id,
              name: step.name,
              type: step.type,
              position: step.position,
              config: step.config,
            })
            .returning(),
        ),
      );

      // Create connections
      if (connections && connections.length > 0) {
        await Promise.all(
          connections.map((conn: any) =>
            tx.insert(workflowConnections).values({
              workflowId: newWorkflow.id,
              sourceStepId: conn.source,
              targetStepId: conn.target,
              sourceHandle: conn.sourceHandle || 'default',
              targetHandle: conn.targetHandle || 'default',
            }),
          ),
        );
      }

      return newWorkflow;
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 },
    );
  }
}
