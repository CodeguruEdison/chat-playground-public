import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WorkflowsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Workflows</h1>
        <Link href="/workflows/new">
          <Button>Create New Workflow</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample workflow cards - these would be fetched from the database */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Sample Workflow</h2>
          <p className="text-gray-600 mb-4">
            A simple workflow to demonstrate the functionality
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Last updated: Just now
            </span>
            <Link href="/workflows/1">
              <Button variant="outline">Edit</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
