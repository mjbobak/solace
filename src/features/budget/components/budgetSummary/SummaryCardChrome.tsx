import React from 'react';
import { LuAlignLeft, LuChartColumn, LuFilter } from 'react-icons/lu';

import { budgetSummaryTheme } from '@/shared/theme';

import {
  cardIconContainerClass,
  formatWholeCurrency,
  type SummaryView,
} from './constants';

interface CurrencyStackProps {
  monthlyAmount: number;
  annualClassName?: string;
  monthlyClassName?: string;
  annualOperator?: React.ReactNode;
  compact?: boolean;
}

export const CurrencyStack: React.FC<CurrencyStackProps> = ({
  monthlyAmount,
  annualClassName = budgetSummaryTheme.summaryValue,
  monthlyClassName = budgetSummaryTheme.summaryTextMuted,
  annualOperator,
  compact = false,
}) => (
  <div className="flex flex-col leading-tight">
    <span className={`flex items-baseline ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <span
        className={`${compact ? 'text-base' : 'text-lg'} font-bold ${annualClassName}`}
      >
        {formatWholeCurrency(monthlyAmount * 12)}
      </span>
      <span
        className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium uppercase tracking-wide ${budgetSummaryTheme.summaryTextMuted}`}
      >
        annual
      </span>
      {annualOperator ? (
        <span
          className={`ml-auto hidden h-5 w-5 items-center justify-center rounded-full sm:inline-flex ${budgetSummaryTheme.waterfallValuePill}`}
        >
          {annualOperator}
        </span>
      ) : null}
    </span>
    <span className={`flex items-baseline ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <span
        className={`${compact ? 'text-[11px]' : 'text-xs'} ${monthlyClassName}`}
      >
        {formatWholeCurrency(monthlyAmount)}
      </span>
      <span
        className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium uppercase tracking-wide ${budgetSummaryTheme.summaryTextMuted}`}
      >
        monthly
      </span>
    </span>
  </div>
);

interface SummaryCardHeaderProps {
  icon: React.ReactNode;
  title: string;
  currentView: SummaryView;
  onToggle: () => void;
  showFilteredBadge?: boolean;
}

export const SummaryCardHeader: React.FC<SummaryCardHeaderProps> = ({
  icon,
  title,
  currentView,
  onToggle,
  showFilteredBadge = false,
}) => {
  const nextLabel =
    currentView === 'chart' ? 'Show numbers view' : 'Show chart view';

  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className={cardIconContainerClass}>{icon}</div>
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm font-semibold uppercase tracking-wider ${budgetSummaryTheme.summaryTitle}`}
          >
            {title}
          </h3>
          {showFilteredBadge ? (
            <div className={budgetSummaryTheme.filteredBadge}>
              <LuFilter className={budgetSummaryTheme.filteredBadgeIcon} />
              Filtered Totals
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className={budgetSummaryTheme.controlButton}
        onClick={onToggle}
        aria-label={nextLabel}
        title={nextLabel}
      >
        {currentView === 'chart' ? (
          <LuAlignLeft className="h-4 w-4" />
        ) : (
          <LuChartColumn className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
