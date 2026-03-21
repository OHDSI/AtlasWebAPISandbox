import { useJobs } from '@/api/jobs';
import { Loading } from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, type ColumnDef } from '@/components/DataTable';
import type { Job } from '@/types';

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  STARTED: 'bg-blue-100 text-blue-800',
  STARTING: 'bg-blue-100 text-blue-800',
  STOPPING: 'bg-yellow-100 text-yellow-800',
  STOPPED: 'bg-gray-100 text-gray-800',
  ABANDONED: 'bg-gray-100 text-gray-600',
};

const defaultStyle = 'bg-gray-100 text-gray-500';

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? defaultStyle;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

const columns: ColumnDef<Job>[] = [
  { key: 'executionId', header: 'Execution ID', accessor: (j) => j.executionId },
  { key: 'jobName', header: 'Job Name', accessor: (j) => j.jobName },
  {
    key: 'status',
    header: 'Status',
    accessor: (j) => j.status,
    render: (j) => <StatusBadge status={j.status} />,
  },
  { key: 'startDate', header: 'Start Date', accessor: (j) => j.startDate },
  { key: 'endDate', header: 'End Date', accessor: (j) => j.endDate ?? '-' },
];

export default function JobsPage() {
  const { data: jobs, isLoading, error } = useJobs();

  if (isLoading) {
    return (
      <div data-testid="page-jobs">
        <Loading message="Loading jobs..." />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-jobs">
        <div role="alert" className="p-4 text-red-600">
          Failed to load jobs.
        </div>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div data-testid="page-jobs">
        <h1 className="text-2xl font-bold mb-4">Jobs</h1>
        <EmptyState
          title="No jobs"
          description="There are no job executions to display."
        />
      </div>
    );
  }

  return (
    <div data-testid="page-jobs">
      <h1 className="text-2xl font-bold mb-4">Jobs</h1>
      <DataTable data={jobs} columns={columns} />
    </div>
  );
}
