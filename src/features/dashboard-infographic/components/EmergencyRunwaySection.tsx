/**
 * Emergency Runway Section
 * Shows how many months you can live off emergency fund in different income loss scenarios
 */

import React, { useEffect, useMemo, useState } from 'react';

import { useBudgetData } from '@/features/budget/hooks/useBudgetData';
import type { SpendBasis } from '@/features/budget/types/budgetView';
import { incomeApiService } from '@/features/income/services/incomeApiService';
import type { IncomeYearProjection } from '@/features/income/types/income';
import { formatCurrency } from '@/shared/utils/currency';

import type { Period } from '../types/infographic';
import { buildEmergencyRunwaySummary } from '../utils/dashboardKpiReport';

import { ScrollAnimatedSection } from './ScrollAnimatedSection';
import { SectionNarrative } from './SectionNarrative';

interface EmergencyRunwaySectionProps {
  year: number;
  spendBasis: SpendBasis;
  period: Period;
}

export const EmergencyRunwaySection: React.FC<
  EmergencyRunwaySectionProps
> = ({ year, spendBasis }) => {
  const [projection, setProjection] = useState<IncomeYearProjection | null>(
    null,
  );
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [isIncomeLoading, setIsIncomeLoading] = useState(true);
  const {
    budgetEntries,
    isLoading: isBudgetLoading,
    error: budgetError,
  } = useBudgetData(year, spendBasis, true);

  useEffect(() => {
    let isCancelled = false;

    const loadProjection = async () => {
      try {
        setIsIncomeLoading(true);
        setIncomeError(null);
        const nextProjection = await incomeApiService.getYearProjection(year);
        if (!isCancelled) {
          setProjection(nextProjection);
        }
      } catch (error) {
        console.error('Failed to load income projection for runway:', error);
        if (!isCancelled) {
          setProjection(null);
          setIncomeError(
            error instanceof Error ? error.message : 'Failed to load income data',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsIncomeLoading(false);
        }
      }
    };

    void loadProjection();

    return () => {
      isCancelled = true;
    };
  }, [year]);

  const runwaySummary = useMemo(
    () =>
      buildEmergencyRunwaySummary({
        projection,
        budgetEntries: budgetError ? null : budgetEntries,
      }),
    [budgetEntries, budgetError, projection],
  );

  const narrative = `These runway scenarios reuse the report inputs: your emergency fund balance, your monthly essential budget, and only the standard income streams. Non-standard income is intentionally ignored here.`;
  const isLoading = isIncomeLoading || isBudgetLoading;
  const error = incomeError ?? budgetError;

  return (
    <ScrollAnimatedSection className="space-y-8 border-t section-divider px-6 py-12">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-app">Emergency Runway</h2>
        <SectionNarrative text={narrative} highlight={true} />
      </div>

      {error ? (
        <div className="surface-card px-6 py-8 text-sm text-danger">
          Unable to load runway scenarios: {error}
        </div>
      ) : isLoading ? (
        <div className="surface-card px-6 py-12 text-center text-muted">
          Loading runway scenarios...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Current Baseline
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Emergency fund
                </p>
                <p className="mt-2 text-2xl font-bold text-app">
                  {runwaySummary.emergencyFundBalance === null
                    ? 'N/A'
                    : formatCurrency(runwaySummary.emergencyFundBalance)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Essential budget / month
                </p>
                <p className="mt-2 text-2xl font-bold text-app">
                  {runwaySummary.monthlyEssentialExpenses === null
                    ? 'N/A'
                    : formatCurrency(runwaySummary.monthlyEssentialExpenses)}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-black/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                Report runway
              </p>
              <p className="mt-2 text-3xl font-bold text-app">
                {formatRunwayLabel(runwaySummary.baselineMonths)}
              </p>
              <p className="mt-2 text-sm text-muted">
                Based on the same emergency fund balance and monthly essential
                expenses shown in report mode.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {runwaySummary.scenarios.map((scenario) => {
              const progressWidth = getRunwayProgressWidth(
                scenario.runwayMonths,
                scenario.monthlyShortfall,
              );

              return (
                <article
                  key={scenario.key}
                  className="surface-card surface-card-hover p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Scenario
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-app">
                    {scenario.label}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {scenario.sourceName
                      ? `${scenario.sourceName} monthly net income is removed from the runway model.`
                      : 'That income source was not found in the current report data.'}
                  </p>

                  <div className="mt-5 space-y-3 text-sm">
                    <MetricRow
                      label="Lost income / month"
                      value={formatOptionalCurrency(scenario.lostMonthlyIncome)}
                    />
                    <MetricRow
                      label="Remaining standard income / month"
                      value={formatOptionalCurrency(
                        scenario.remainingMonthlyIncome,
                      )}
                    />
                    <MetricRow
                      label="Emergency fund draw / month"
                      value={formatShortfallValue(scenario.monthlyShortfall)}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-end justify-between gap-4">
                      <span className="text-xs uppercase tracking-wide text-muted">
                        Runway
                      </span>
                      <span className="text-2xl font-bold text-app">
                        {formatScenarioRunwayLabel(
                          scenario.runwayMonths,
                          scenario.monthlyShortfall,
                        )}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-black/[0.06]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-500"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </ScrollAnimatedSection>
  );
};

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-app">{value}</span>
    </div>
  );
}

function formatOptionalCurrency(amount: number | null): string {
  return amount === null ? 'N/A' : formatCurrency(amount);
}

function formatRunwayLabel(months: number | null): string {
  return months === null ? 'N/A' : `${months.toFixed(1)} months`;
}

function formatShortfallValue(amount: number | null): string {
  if (amount === null) {
    return 'N/A';
  }

  if (amount === 0) {
    return 'No draw needed';
  }

  return formatCurrency(amount);
}

function formatScenarioRunwayLabel(
  months: number | null,
  monthlyShortfall: number | null,
): string {
  if (monthlyShortfall === null) {
    return 'N/A';
  }

  if (monthlyShortfall === 0) {
    return 'Covered';
  }

  return formatRunwayLabel(months);
}

function getRunwayProgressWidth(
  months: number | null,
  monthlyShortfall: number | null,
): number {
  if (monthlyShortfall === null) {
    return 0;
  }

  if (monthlyShortfall === 0) {
    return 100;
  }

  if (months === null) {
    return 0;
  }

  return Math.max(8, Math.min((months / 12) * 100, 100));
}
