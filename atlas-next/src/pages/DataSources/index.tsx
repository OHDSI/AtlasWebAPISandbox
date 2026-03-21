import { useSources } from '@/api/source';
import { useSourceStore } from '@/stores/source';
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

export default function DataSourcesPage() {
  const { data: sources, isLoading, error } = useSources();
  const vocabularyUrl = useSourceStore((s) => s.vocabularyUrl);
  const evidenceUrl = useSourceStore((s) => s.evidenceUrl);
  const resultsUrl = useSourceStore((s) => s.resultsUrl);

  const handleReset = () => {
    useSourceStore.getState().resetToDefaults();
  };

  if (isLoading) {
    return (
      <div data-testid="page-datasources">
        <Loading message="Loading data sources..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-datasources">
        <div role="alert" className="p-4 text-red-600">
          Failed to load data sources.
        </div>
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div data-testid="page-datasources">
        <h1 className="text-2xl font-bold mb-4">Data Sources</h1>
        <EmptyState
          title="No data sources"
          description="Configure a data source to get started."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-datasources">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Data Sources</h1>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          data-testid="reset-defaults-btn"
        >
          Reset to Defaults
        </button>
      </div>

      <section className="mb-6 rounded border border-gray-200 p-4" aria-label="Current URL configuration">
        <h2 className="text-lg font-semibold mb-2">Current Configuration</h2>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Vocabulary URL</dt>
            <dd className="text-gray-900" data-testid="vocabulary-url">{vocabularyUrl ?? 'Not set'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Evidence URL</dt>
            <dd className="text-gray-900" data-testid="evidence-url">{evidenceUrl ?? 'Not set'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Results URL</dt>
            <dd className="text-gray-900" data-testid="results-url">{resultsUrl ?? 'Not set'}</dd>
          </div>
        </dl>
      </section>

      <DataTable data={sources} columns={columns} />
    </div>
  );
}
