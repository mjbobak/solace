import React from 'react';

import { useDashboardKpiReport } from '../hooks/useDashboardKpiReport';
import { formatDashboardKpiValue } from '../utils/dashboardKpiReport';

interface DashboardKpiReportProps {
  year: number;
  availableYears: number[];
}

export const DashboardKpiReport: React.FC<DashboardKpiReportProps> = ({
  year,
  availableYears,
}) => {
  const { groups, isLoading, error } = useDashboardKpiReport(
    year,
    availableYears,
  );

  return (
    <section
      aria-label="Wealth management KPI report"
      className="surface-card overflow-hidden"
    >
      <div className="border-b border-black/5 px-6 py-4">
        <h2 className="text-xl font-semibold text-app">
          Wealth Management KPI Report
        </h2>
        <p className="mt-1 text-sm text-muted">Planning year {year}</p>
        {error ? (
          <p className="mt-2 text-sm text-amber-700">
            Some KPI values could not be loaded and may appear as N/A.
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-sm text-muted">Loading report...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-black/[0.03]">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-app">
                  Metric
                </th>
                <th className="px-6 py-3 text-right font-semibold text-app">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <React.Fragment key={group.title}>
                  <tr className="border-t border-black/10 bg-black/[0.02]">
                    <th
                      colSpan={2}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                    >
                      {group.title}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.key} className="border-t border-black/5">
                      <th
                        scope="row"
                        className="px-6 py-3 text-left font-medium text-app"
                      >
                        {row.label}
                      </th>
                      <td className="px-6 py-3 text-right text-app">
                        {formatDashboardKpiValue(row.value)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
