import { EmptyState } from '@/components/EmptyState';

export default function ReusablesPage() {
  return (
    <div data-testid="page-reusables">
      <h1 className="text-2xl font-bold mb-4">Reusables</h1>
      <EmptyState
        title="No reusable components"
        description="Reusable component definitions will appear here once created."
      />
    </div>
  );
}
