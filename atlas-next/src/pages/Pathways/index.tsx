import { usePathways } from '@/api/pathway';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { Pathway } from '@/types';

const columns: ColumnDef<Pathway>[] = [
  { key: 'id', header: 'ID', accessor: (p) => p.id },
  { key: 'name', header: 'Name', accessor: (p) => p.name },
  { key: 'description', header: 'Description', accessor: (p) => p.description },
];

export default function PathwaysPage() {
  const { data: pathways, isLoading, error } = usePathways();

  if (isLoading) {
    return (
      <div data-testid="page-pathways">
        <Loading message="Loading pathways..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-pathways">
        <div role="alert" className="p-4 text-red-600">Failed to load pathways.</div>
      </div>
    );
  }

  if (!pathways || pathways.length === 0) {
    return (
      <div data-testid="page-pathways">
        <h1 className="text-2xl font-bold mb-4">Pathways</h1>
        <EmptyState title="No pathways" description="Create a pathway analysis to get started." />
      </div>
    );
  }

  return (
    <div data-testid="page-pathways">
      <h1 className="text-2xl font-bold mb-4">Pathways</h1>
      <DataTable data={pathways} columns={columns} />
    </div>
  );
}
