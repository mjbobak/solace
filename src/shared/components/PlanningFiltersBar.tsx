import React from 'react';
import { BsInfoCircle } from 'react-icons/bs';

import type { SpendBasis } from '@/features/budget/types/budgetView';
import { Tooltip } from '@/shared/components/Tooltip';
import { getAvailableSpendBasisOptions } from '@/shared/utils/spendBasis';

import { CustomDropdown } from './CustomDropdown';
import { PlanningYearDropdown } from './PlanningYearDropdown';

interface PlanningFiltersBarProps {
  planningYear: number;
  availableYears: number[];
  onPlanningYearChange: (year: number) => void;
  spendBasis: SpendBasis;
  onSpendBasisChange: (spendBasis: SpendBasis) => void;
  showPlanningYear: boolean;
  showSpendBasis: boolean;
  spendBasisTooltipContent?: string;
}

export const PlanningFiltersBar: React.FC<PlanningFiltersBarProps> = ({
  planningYear,
  availableYears,
  onPlanningYearChange,
  spendBasis,
  onSpendBasisChange,
  showPlanningYear,
  showSpendBasis,
  spendBasisTooltipContent,
}) => {
  if (!showPlanningYear && !showSpendBasis) {
    return null;
  }

  const spendBasisOptions = getAvailableSpendBasisOptions(planningYear);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {showPlanningYear ? (
        <PlanningYearDropdown
          year={planningYear}
          years={availableYears}
          onYearChange={onPlanningYearChange}
          className="min-w-[216px]"
        />
      ) : null}

      {showSpendBasis ? (
        <div className="flex items-center gap-2">
          <CustomDropdown
            value={spendBasis}
            options={spendBasisOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={(value) => onSpendBasisChange(value as SpendBasis)}
            labelPrefix="Spending basis"
            className="min-w-[240px]"
            triggerClassName="pl-4"
          />
          {spendBasisTooltipContent ? (
            <Tooltip content={spendBasisTooltipContent} stacked>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-app focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/35"
                aria-label="Explain spending basis"
              >
                <BsInfoCircle size={14} />
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
