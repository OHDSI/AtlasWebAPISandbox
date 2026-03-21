import { useState } from 'react';
import { useVocabularySearch } from '@/api/vocabulary';
import { useSourceStore } from '@/stores/source';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { Concept } from '@/types';

const columns: ColumnDef<Concept>[] = [
  { key: 'conceptId', header: 'ID', accessor: (c) => c.conceptId },
  { key: 'conceptName', header: 'Name', accessor: (c) => c.conceptName },
  { key: 'domainId', header: 'Domain', accessor: (c) => c.domainId },
  { key: 'vocabularyId', header: 'Vocabulary', accessor: (c) => c.vocabularyId },
  { key: 'conceptClassId', header: 'Class', accessor: (c) => c.conceptClassId },
  { key: 'standardConcept', header: 'Standard', accessor: (c) => c.standardConcept },
  { key: 'conceptCode', header: 'Code', accessor: (c) => c.conceptCode },
];

export default function VocabularyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const sources = useSourceStore((s) => s.sources);
  const defaultSourceKey = sources[0]?.sourceKey ?? '';

  const { data: concepts, isLoading, error } = useVocabularySearch(query, defaultSourceKey);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchTerm);
  };

  return (
    <div data-testid="page-vocabulary">
      <h1 className="text-2xl font-bold mb-4">Vocabulary Search</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4" role="search">
        <label htmlFor="vocab-search" className="sr-only">Search vocabulary</label>
        <input
          id="vocab-search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search concepts..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Search
        </button>
      </form>

      {isLoading && <Loading message="Searching vocabulary..." />}

      {error && (
        <div role="alert" className="p-4 text-red-600">
          Failed to search vocabulary.
        </div>
      )}

      {!isLoading && !error && query && concepts && concepts.length === 0 && (
        <EmptyState
          title="No results found"
          description={`No concepts matching "${query}".`}
        />
      )}

      {!isLoading && !error && concepts && concepts.length > 0 && (
        <DataTable data={concepts} columns={columns} />
      )}

      {!query && !isLoading && (
        <EmptyState
          title="Search for concepts"
          description="Enter a search term to find vocabulary concepts."
        />
      )}
    </div>
  );
}
