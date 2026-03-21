import { useEstimations } from '@/api/estimation';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { Estimation } from '@/types';

const columns: ColumnDef<Estimation>[] = [
  { key: 'id', header: 'ID', accessor: (e) => e.id },
  { key: 'name', header: 'Name', accessor: (e) => e.name },
  { key: 'description', header: 'Description', accessor: (e) => e.description },
];

export default function EstimationPage() {
  const { data: estimations, isLoading, error } = useEstimations();

  if (isLoading) {
    return (
      <div data-testid="page-estimation">
        <Loading message="Loading estimations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-estimation">
        <div role="alert" className="p-4 text-red-600">
          Failed to load estimations.
        </div>
      </div>
    );
  }

  if (!estimations || estimations.length === 0) {
    return (
      <div data-testid="page-estimation">
        <h1 className="text-2xl font-bold mb-4">Estimation</h1>
        <EmptyState
          title="No estimations"
          description="Create an estimation analysis to get started."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-estimation">
      <h1 className="text-2xl font-bold mb-4">Estimation</h1>
      <DataTable data={estimations} columns={columns} />
    </div>
  );
}
