import React from 'react';
import { LuChevronDown, LuChevronRight, LuFilter } from 'react-icons/lu';

import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
import { budgetSummaryTheme } from '@/shared/theme';

import { formatWholeCurrency, type SummaryView } from './constants';

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
  title: string;
  currentView?: SummaryView;
  onToggle?: () => void;
  showFilteredBadge?: boolean;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export const SummaryCardHeader: React.FC<SummaryCardHeaderProps> = ({
  title,
  currentView,
  onToggle,
  showFilteredBadge = false,
  isCollapsed = false,
  onToggleCollapsed,
}) => {
  const collapseLabel = isCollapsed
    ? `Show ${title.toLowerCase()} details`
    : `Hide ${title.toLowerCase()} details`;

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        isCollapsed ? '' : 'mb-3'
      }`}
    >
      <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-2">
        {!isCollapsed && currentView && onToggle ? (
          <ToggleButtonGroup
            value={currentView}
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'numbers', label: 'Text' },
            ]}
            onChange={(next) => {
              if (next !== currentView) {
                onToggle();
              }
            }}
          />
        ) : null}
        {onToggleCollapsed ? (
          <button
            type="button"
            className={budgetSummaryTheme.controlButton}
            onClick={onToggleCollapsed}
            aria-expanded={!isCollapsed}
            aria-label={collapseLabel}
            title={collapseLabel}
          >
            {isCollapsed ? (
              <LuChevronRight className="h-4 w-4" />
            ) : (
              <LuChevronDown className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
};
