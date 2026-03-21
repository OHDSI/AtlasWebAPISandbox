const tools = [
  { name: 'SQL Query Runner', description: 'Execute SQL queries against connected data sources.' },
  { name: 'Import / Export', description: 'Import or export cohort definitions and concept sets.' },
  { name: 'Job Viewer', description: 'View detailed execution logs for analysis jobs.' },
  { name: 'R Code Generator', description: 'Generate R code for cohort comparison analyses.' },
  { name: 'Data Quality Dashboard', description: 'Review data quality metrics for your sources.' },
];

export default function ToolsPage() {
  return (
    <div data-testid="page-tools">
      <h1 className="text-2xl font-bold mb-4">Tools</h1>
      <p className="text-sm text-gray-600 mb-6">
        Utilities and tools available in Atlas.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="tools-list">
        {tools.map((tool) => (
          <li
            key={tool.name}
            className="rounded border border-gray-200 p-4 hover:shadow-sm"
          >
            <h2 className="text-base font-semibold text-gray-900">{tool.name}</h2>
            <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
