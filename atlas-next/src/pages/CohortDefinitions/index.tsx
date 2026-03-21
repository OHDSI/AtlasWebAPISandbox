import { useState } from 'react';
import { useCohortDefinitions, useCohortDefinition } from '@/api/cohort-definition';
import { useDirtyFlag } from '@/hooks/useDirtyFlag';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { CohortDefinition } from '@/types';

const listColumns: ColumnDef<CohortDefinition>[] = [
  { key: 'id', header: 'ID', accessor: (c) => c.id },
  { key: 'name', header: 'Name', accessor: (c) => c.name },
  { key: 'createdBy', header: 'Created By', accessor: (c) => c.createdBy },
  { key: 'modifiedDate', header: 'Modified', accessor: (c) => c.modifiedDate },
];

export default function CohortDefinitionsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (selectedId !== null) {
    return <CohortDefinitionDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return <CohortDefinitionList onSelect={(id) => setSelectedId(id)} />;
}

function CohortDefinitionList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: definitions, isLoading, error } = useCohortDefinitions();

  if (isLoading) {
    return (
      <div data-testid="page-cohortdefinitions">
        <Loading message="Loading cohort definitions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-cohortdefinitions">
        <div role="alert" className="p-4 text-red-600">Failed to load cohort definitions.</div>
      </div>
    );
  }

  if (!definitions || definitions.length === 0) {
    return (
      <div data-testid="page-cohortdefinitions">
        <h1 className="text-2xl font-bold mb-4">Cohort Definitions</h1>
        <EmptyState title="No cohort definitions" description="Create a cohort definition to get started." />
      </div>
    );
  }

  return (
    <div data-testid="page-cohortdefinitions">
      <h1 className="text-2xl font-bold mb-4">Cohort Definitions</h1>
      <DataTable
        data={definitions}
        columns={listColumns}
        onRowClick={(row) => onSelect(row.id)}
      />
    </div>
  );
}

function CohortDefinitionDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: definition, isLoading, error } = useCohortDefinition(id);
  const { isDirty } = useDirtyFlag(definition);

  if (isLoading) {
    return (
      <div data-testid="page-cohortdefinitions">
        <Loading message="Loading cohort definition..." />
      </div>
    );
  }

  if (error || !definition) {
    return (
      <div data-testid="page-cohortdefinitions">
        <div role="alert" className="p-4 text-red-600">Failed to load cohort definition.</div>
      </div>
    );
  }

  return (
    <div data-testid="page-cohortdefinitions">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
      >
        ← Back to list
      </button>
      <h1 className="text-2xl font-bold mb-2">{definition.name}</h1>
      {isDirty && (
        <span className="text-sm text-amber-600" role="status">Unsaved changes</span>
      )}
      <p className="text-gray-600 mt-2">{definition.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="font-medium text-gray-500">Created By</dt>
        <dd>{definition.createdBy}</dd>
        <dt className="font-medium text-gray-500">Modified</dt>
        <dd>{definition.modifiedDate}</dd>
      </dl>
    </div>
  );
}
