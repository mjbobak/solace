import React, { useState } from 'react';
import { BsInfoCircle } from 'react-icons/bs';

import { Tooltip } from '@/shared/components/Tooltip';
import { useDashboardKpiReport } from '../hooks/useDashboardKpiReport';
import {
  DEFAULT_EMERGENCY_FUND_BALANCE,
  formatDashboardKpiValue,
  type DashboardKpiRow,
} from '../utils/dashboardKpiReport';

interface DashboardKpiReportProps {
  year: number;
  availableYears: number[];
}

const METRIC_EXPLANATIONS: Record<string, string> = {
  'net-worth':
    'Total assets minus total liabilities. Think cash, investments, home equity, and debt balances rolled into one snapshot.',
  'net-worth-growth-rate':
    'Year-over-year change in net worth. General formula: (current net worth - prior net worth) / prior net worth.',
  'net-worth-growth-vs-income-growth':
    'Compares wealth growth to income growth to show whether net worth is growing faster than earnings.',
  'savings-rate':
    'Portion of after-tax income kept instead of spent. General formula: (savings + investment contributions) / after-tax income.',
  'annual-savings-amount':
    'After-tax income left over after living expenses and planned investment contributions.',
  'annual-investment-contributions':
    'Total planned annual dollars directed to investment categories, usually monthly amounts multiplied across 12 months.',
  'gross-income':
    'Income before taxes and other payroll deductions are taken out.',
  'after-tax-income':
    'Take-home income after estimated taxes and payroll deductions.',
  'income-growth-rate':
    'Year-over-year income change. General formula: (current income - prior income) / prior income.',
  'savings-efficiency':
    'Share of after-tax income that remains as cash savings after expenses. General formula: savings / after-tax income.',
  'total-monthly-expenses':
    'Average planned monthly living expenses. Often annual living expenses divided by 12.',
  'annual-living-expenses':
    'Total planned yearly spending on non-investment living categories.',
  'expense-growth-rate':
    'Year-over-year change in expenses. General formula: (current expenses - prior expenses) / prior expenses.',
  'essential-spending':
    'Actual spent amount for living expenses marked as Essential in your budget types for the current report basis.',
  'funsies-spending':
    'Actual spent amount for living expenses marked as Funsies in your budget types for the current report basis.',
  'expense-ratio':
    'How much of after-tax income is consumed by living expenses. General formula: living expenses / after-tax income.',
  'emergency-fund-balance':
    'Editable cash reserve amount used for this report. Update it here to recalculate how many months of budgeted expenses it can cover.',
  'emergency-fund-months':
    'How long the emergency fund could cover one month of budgeted Essential expenses. General formula: emergency fund balance / monthly budgeted Essential expenses.',
  'cash-reserves':
    'Liquid funds available now, usually checking, savings, and other easy-to-access cash accounts.',
  'tax-advantaged-contributions':
    'Combined annual contributions to accounts with tax benefits, such as 401(k), HSA, Roth IRA, or 529 plans.',
  'tax-advantaged-savings-ratio':
    'Share of after-tax income flowing into tax-advantaged accounts. General formula: tax-advantaged contributions / after-tax income.',
  '401k-contributions':
    'Planned annual employee contributions to a 401(k) retirement account.',
  'roth-ira-contributions':
    'Planned annual contributions to a Roth IRA using after-tax dollars.',
  'hsa-contributions':
    'Planned annual contributions to a health savings account for qualified medical expenses.',
  '529-contributions':
    'Planned annual contributions to a 529 education savings plan.',
  'retirement-funding-ratio':
    'Progress toward a retirement savings target, often current retirement contributions or assets compared against a target amount.',
};

function parseEmergencyFundInput(value: string): number | null {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return Math.max(0, parsedValue);
}

function getMetricExplanation(row: DashboardKpiRow): string {
  return (
    METRIC_EXPLANATIONS[row.key] ??
    `${row.label} is a high-level planning metric shown here to summarize the relationship between income, expenses, savings, or reserves.`
  );
}

function renderMetricValue(
  row: DashboardKpiRow,
  emergencyFundInput: string,
  onEmergencyFundInputChange: (value: string) => void,
): React.ReactNode {
  if (row.key !== 'emergency-fund-balance') {
    return formatDashboardKpiValue(row.value);
  }

  return (
    <div className="flex justify-end">
      <label className="sr-only" htmlFor="emergency-fund-balance-input">
        Emergency fund balance
      </label>
      <div className="relative w-36">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
          $
        </span>
        <input
          id="emergency-fund-balance-input"
          type="number"
          min="0"
          step="100"
          inputMode="decimal"
          value={emergencyFundInput}
          onChange={(event) => onEmergencyFundInputChange(event.target.value)}
          className="form-input h-9 w-full pl-7 pr-3 text-right"
          aria-label="Emergency fund balance"
        />
      </div>
    </div>
  );
}

export const DashboardKpiReport: React.FC<DashboardKpiReportProps> = ({
  year,
  availableYears,
}) => {
  const [emergencyFundInput, setEmergencyFundInput] = useState(
    String(DEFAULT_EMERGENCY_FUND_BALANCE),
  );
  const emergencyFundBalance = parseEmergencyFundInput(emergencyFundInput);
  const { groups, isLoading, error } = useDashboardKpiReport(
    year,
    availableYears,
    emergencyFundBalance,
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
                <th className="px-6 py-3 text-left font-semibold text-app">
                  Strong Looks Like
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <React.Fragment key={group.title}>
                  <tr className="border-t border-black/10 bg-black/[0.02]">
                    <th
                      colSpan={3}
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
                        <div className="flex items-center gap-2">
                          <span>{row.label}</span>
                          <Tooltip content={getMetricExplanation(row)} stacked>
                            <button
                              type="button"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:text-app focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/35"
                              aria-label={`Explain ${row.label}`}
                            >
                              <BsInfoCircle size={12} />
                            </button>
                          </Tooltip>
                        </div>
                      </th>
                      <td className="px-6 py-3 text-right text-app">
                        {renderMetricValue(
                          row,
                          emergencyFundInput,
                          setEmergencyFundInput,
                        )}
                      </td>
                      <td className="px-6 py-3 text-left text-sm text-muted">
                        {row.benchmark}
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
