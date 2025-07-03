import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function WorkflowNav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/workflows">
              <Button variant="ghost">Workflows</Button>
            </Link>
            <Link href="/workflows/new">
              <Button variant="ghost">New Workflow</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
