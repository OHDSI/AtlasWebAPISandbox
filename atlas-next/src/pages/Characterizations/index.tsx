import { useCharacterizations } from '@/api/characterization';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { CohortCharacterization } from '@/types';

const columns: ColumnDef<CohortCharacterization>[] = [
  { key: 'id', header: 'ID', accessor: (c) => c.id },
  { key: 'name', header: 'Name', accessor: (c) => c.name },
  { key: 'description', header: 'Description', accessor: (c) => c.description },
];

export default function CharacterizationsPage() {
  const { data: characterizations, isLoading, error } = useCharacterizations();

  if (isLoading) {
    return (
      <div data-testid="page-characterizations">
        <Loading message="Loading characterizations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-characterizations">
        <div role="alert" className="p-4 text-red-600">Failed to load characterizations.</div>
      </div>
    );
  }

  if (!characterizations || characterizations.length === 0) {
    return (
      <div data-testid="page-characterizations">
        <h1 className="text-2xl font-bold mb-4">Characterizations</h1>
        <EmptyState title="No characterizations" description="Create a characterization to get started." />
      </div>
    );
  }

  return (
    <div data-testid="page-characterizations">
      <h1 className="text-2xl font-bold mb-4">Characterizations</h1>
      <DataTable data={characterizations} columns={columns} />
    </div>
  );
}
