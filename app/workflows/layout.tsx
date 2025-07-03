import { WorkflowNav } from '@/components/workflow/nav';

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <WorkflowNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
