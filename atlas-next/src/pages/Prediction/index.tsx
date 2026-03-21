import { usePredictions } from '@/api/prediction';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { Prediction } from '@/types';

const columns: ColumnDef<Prediction>[] = [
  { key: 'id', header: 'ID', accessor: (p) => p.id },
  { key: 'name', header: 'Name', accessor: (p) => p.name },
  { key: 'description', header: 'Description', accessor: (p) => p.description },
];

export default function PredictionPage() {
  const { data: predictions, isLoading, error } = usePredictions();

  if (isLoading) {
    return (
      <div data-testid="page-prediction">
        <Loading message="Loading predictions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-prediction">
        <div role="alert" className="p-4 text-red-600">
          Failed to load predictions.
        </div>
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div data-testid="page-prediction">
        <h1 className="text-2xl font-bold mb-4">Prediction</h1>
        <EmptyState
          title="No predictions"
          description="Create a prediction analysis to get started."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-prediction">
      <h1 className="text-2xl font-bold mb-4">Prediction</h1>
      <DataTable data={predictions} columns={columns} />
    </div>
  );
}
