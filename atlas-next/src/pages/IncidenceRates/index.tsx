import { useIRAnalyses } from '@/api/ir-analysis';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { IRAnalysis } from '@/types';

const columns: ColumnDef<IRAnalysis>[] = [
  { key: 'id', header: 'ID', accessor: (ir) => ir.id },
  { key: 'name', header: 'Name', accessor: (ir) => ir.name },
  { key: 'description', header: 'Description', accessor: (ir) => ir.description },
];

export default function IncidenceRatesPage() {
  const { data: analyses, isLoading, error } = useIRAnalyses();

  if (isLoading) {
    return (
      <div data-testid="page-incidencerates">
        <Loading message="Loading incidence rates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-incidencerates">
        <div role="alert" className="p-4 text-red-600">Failed to load incidence rates.</div>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div data-testid="page-incidencerates">
        <h1 className="text-2xl font-bold mb-4">Incidence Rates</h1>
        <EmptyState title="No incidence rate analyses" description="Create an IR analysis to get started." />
      </div>
    );
  }

  return (
    <div data-testid="page-incidencerates">
      <h1 className="text-2xl font-bold mb-4">Incidence Rates</h1>
      <DataTable data={analyses} columns={columns} />
    </div>
  );
}
