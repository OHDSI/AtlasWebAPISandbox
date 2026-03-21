import { useSources } from '@/api/source';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import type { Source } from '@/types';

const sourceColumns = [
  { key: 'sourceName', header: 'Name', accessor: (s: Source) => s.sourceName },
  { key: 'sourceKey', header: 'Key', accessor: (s: Source) => s.sourceKey },
  { key: 'sourceDialect', header: 'Dialect', accessor: (s: Source) => s.sourceDialect },
];

export default function HomePage() {
  const { data: sources, isLoading, error } = useSources();

  if (isLoading) {
    return (
      <div data-testid="page-home">
        <Loading message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-home">
        <div role="alert" className="p-4 text-red-600">
          Failed to load dashboard data.
        </div>
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div data-testid="page-home">
        <h1 className="text-2xl font-bold mb-4">Welcome to Atlas</h1>
        <EmptyState
          title="No data sources configured"
          description="Configure a data source to get started."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-home">
      <h1 className="text-2xl font-bold mb-4">Welcome to Atlas</h1>
      <section aria-label="Data Sources">
        <h2 className="text-lg font-semibold mb-2">Data Sources ({sources.length})</h2>
        <table className="min-w-full divide-y divide-gray-200" role="grid">
          <thead className="bg-gray-50">
            <tr>
              {sourceColumns.map((col) => (
                <th key={col.key} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((source) => (
              <tr key={source.sourceId}>
                {sourceColumns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-900">
                    {col.accessor(source)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
