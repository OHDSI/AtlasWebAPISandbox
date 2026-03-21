import { EmptyState } from '@/components/EmptyState';

export default function TaggingPage() {
  return (
    <div data-testid="page-tagging">
      <h1 className="text-2xl font-bold mb-4">Tagging</h1>
      <EmptyState
        title="No tags defined"
        description="Create tags to organize and categorize your analyses."
      />
    </div>
  );
}
