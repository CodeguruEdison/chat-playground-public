import { WorkflowBuilder } from '@/components/workflow/workflow-builder';

export default function NewWorkflowPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Create New Workflow</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <WorkflowBuilder />
      </div>
    </div>
  );
}
