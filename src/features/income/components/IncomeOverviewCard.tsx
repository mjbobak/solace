import React, { useState } from 'react';

import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';

import {
  useIncomeOverviewTotals,
  type IncomeOverviewMode,
} from '../hooks/useIncomeOverviewTotals';
import type {
  IncomeProjectionTotals,
  ProjectedIncomeSource,
} from '../types/income';
import { formatWholeCurrency } from '../utils/incomeViewFormatters';

const OVERVIEW_MODE_OPTIONS: { value: IncomeOverviewMode; label: string }[] = [
  { value: 'all', label: 'All Income' },
  { value: 'salary', label: 'Salary' },
  { value: 'bonus', label: 'Bonus' },
];

interface IncomeOverviewCardProps {
  totals: IncomeProjectionTotals;
  sources: ProjectedIncomeSource[];
}

interface OverviewMetricProps {
  label: string;
  annualValue: number;
  className?: string;
}

function OverviewMetric({
  label,
  annualValue,
  className = '',
}: OverviewMetricProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <span className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold leading-tight text-app md:text-2xl">
          {formatWholeCurrency(annualValue)}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Annual
        </span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-xs font-semibold text-muted">
          {formatWholeCurrency(annualValue / 12)}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Month
        </span>
      </span>
    </div>
  );
}

export const IncomeOverviewCard: React.FC<IncomeOverviewCardProps> = ({
  totals,
  sources,
}) => {
  const [mode, setMode] = useState<IncomeOverviewMode>('all');
  const displayedTotals = useIncomeOverviewTotals(totals, sources, mode);

  return (
    <article className="surface-card h-full p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Income Overview
        </p>
        <ToggleButtonGroup
          value={mode}
          options={OVERVIEW_MODE_OPTIONS}
          onChange={setMode}
        />
      </div>
      <div className="mt-2.5 grid gap-4 md:grid-cols-2 md:gap-0">
        <OverviewMetric
          label="Gross"
          annualValue={displayedTotals.plannedGross}
        />
        <OverviewMetric
          label="Net"
          annualValue={displayedTotals.plannedNet}
          className="border-t pt-3 md:border-t-0 md:border-l md:pl-6 md:pt-0 section-divider"
        />
      </div>
    </article>
  );
};
