import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  workflows,
  workflowSteps,
  workflowConnections,
  workflowExecutions,
} from '@/lib/db/schema/workflow';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const workflowId = params.id;
    const body = await request.json();
    const { input } = body;

    // Create execution record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        status: 'running',
        input,
      })
      .returning();

    // Get workflow steps and connections
    const steps = await db.query.workflowSteps.findMany({
      where: eq(workflowSteps.workflowId, workflowId),
    });

    const connections = await db.query.workflowConnections.findMany({
      where: eq(workflowConnections.workflowId, workflowId),
    });

    // Simple execution logic - in a real implementation, this would be more sophisticated
    let currentStep = steps.find((step) => step.type === 'input');
    let result = input;

    while (currentStep) {
      // Process the current step
      if (currentStep.type === 'llm') {
        // In a real implementation, this would call an LLM API
        result = `Processed by ${currentStep.name}: ${result}`;
      }

      // Find the next step
      const nextConnection = connections.find(
        (conn) => conn.sourceStepId === currentStep?.id,
      );
      if (!nextConnection) break;

      currentStep = steps.find(
        (step) => step.id === nextConnection.targetStepId,
      );
    }

    // Update execution record
    await db
      .update(workflowExecutions)
      .set({
        status: 'completed',
        output: result,
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, execution.id));

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 },
    );
  }
}
