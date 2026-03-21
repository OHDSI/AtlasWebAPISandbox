import { useState } from 'react';
import { useSources } from '@/api/source';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import type { Source } from '@/types';

export default function ProfilesPage() {
  const { data: sources, isLoading, error } = useSources();
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('');

  if (isLoading) {
    return (
      <div data-testid="page-profiles">
        <Loading message="Loading data sources..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-profiles">
        <div role="alert" className="p-4 text-red-600">
          Failed to load data sources.
        </div>
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div data-testid="page-profiles">
        <h1 className="text-2xl font-bold mb-4">Profiles</h1>
        <EmptyState
          title="No data sources available"
          description="Configure a data source to view patient profiles."
        />
      </div>
    );
  }

  const selectedSource = sources.find((s: Source) => s.sourceKey === selectedSourceKey);

  return (
    <div data-testid="page-profiles">
      <h1 className="text-2xl font-bold mb-4">Profiles</h1>
      <div className="mb-4">
        <label htmlFor="source-select" className="block text-sm font-medium text-gray-700 mb-1">
          Data Source
        </label>
        <select
          id="source-select"
          data-testid="source-select"
          className="block w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm"
          value={selectedSourceKey}
          onChange={(e) => setSelectedSourceKey(e.target.value)}
        >
          <option value="">Select a data source</option>
          {sources.map((source: Source) => (
            <option key={source.sourceKey} value={source.sourceKey}>
              {source.sourceName}
            </option>
          ))}
        </select>
      </div>
      {selectedSource ? (
        <div data-testid="profile-content" className="p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-600">
            Viewing profiles from: <strong>{selectedSource.sourceName}</strong>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Patient profile data will be displayed here.
          </p>
        </div>
      ) : (
        <EmptyState
          title="No source selected"
          description="Select a data source above to view patient profiles."
        />
      )}
    </div>
  );
}
