import { useSources } from '@/api/source';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { Source } from '@/types';

const columns: ColumnDef<Source>[] = [
  { key: 'sourceName', header: 'Name', accessor: (s) => s.sourceName },
  { key: 'sourceKey', header: 'Key', accessor: (s) => s.sourceKey },
  { key: 'sourceDialect', header: 'Dialect', accessor: (s) => s.sourceDialect },
  { key: 'daimons', header: 'Daimons', accessor: (s) => s.daimons.length },
];

export default function ConfigurationPage() {
  const { data: sources, isLoading, error } = useSources();

  if (isLoading) {
    return (
      <div data-testid="page-configuration">
        <Loading message="Loading sources..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-configuration">
        <div role="alert" className="p-4 text-red-600">
          Failed to load sources.
        </div>
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div data-testid="page-configuration">
        <h1 className="text-2xl font-bold mb-4">Configuration</h1>
        <EmptyState
          title="No sources configured"
          description="Add a data source to get started."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-configuration">
      <h1 className="text-2xl font-bold mb-4">Configuration</h1>
      <DataTable data={sources} columns={columns} />
    </div>
  );
}
