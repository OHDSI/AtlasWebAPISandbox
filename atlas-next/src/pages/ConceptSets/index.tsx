import { useConceptSets } from '@/api/concept-set';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { ConceptSet } from '@/types';

const columns: ColumnDef<ConceptSet>[] = [
  { key: 'id', header: 'ID', accessor: (c) => c.id },
  { key: 'name', header: 'Name', accessor: (c) => c.name },
];

export default function ConceptSetsPage() {
  const { data: conceptSets, isLoading, error } = useConceptSets();

  if (isLoading) {
    return (
      <div data-testid="page-conceptsets">
        <Loading message="Loading concept sets..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-conceptsets">
        <div role="alert" className="p-4 text-red-600">Failed to load concept sets.</div>
      </div>
    );
  }

  if (!conceptSets || conceptSets.length === 0) {
    return (
      <div data-testid="page-conceptsets">
        <h1 className="text-2xl font-bold mb-4">Concept Sets</h1>
        <EmptyState title="No concept sets" description="Create a concept set to get started." />
      </div>
    );
  }

  return (
    <div data-testid="page-conceptsets">
      <h1 className="text-2xl font-bold mb-4">Concept Sets</h1>
      <DataTable data={conceptSets} columns={columns} />
    </div>
  );
}
