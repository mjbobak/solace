import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Tooltip } from '@/shared/components/Tooltip';

import {
  compactCardContentHeight,
  formatWholeCurrency,
  getBarTooltipContent,
  paletteBlue,
  paletteGreen,
  pillLabelTextClass,
  pillValueTextClass,
  palettePurple,
} from './constants';

interface IncomeAllocationChartProps {
  annualIncomeSummary: string;
  annualEssentialSummary: string;
  annualFunsiesSummary: string;
  annualWealthSummary: string;
  essentialWidth: number;
  funsiesWidth: number;
  savingsWidth: number;
  essentialBudget: number;
  funsiesBudget: number;
  savingsForAllocation: number;
  essentialIncomePercent: number;
  funsiesIncomePercent: number;
  wealthIncomePercent: number;
  isWealthExpanded: boolean;
  onWealthToggle: () => void;
  plannedSavings: number;
  investments: number;
  savingsIncomePercent: number;
  investmentIncomePercent: number;
}

interface SegmentLabelProps {
  value: string;
  label: string;
  valueClassName?: string;
  labelClassName?: string;
  align?: 'start' | 'end';
}

const SegmentLabel: React.FC<SegmentLabelProps> = ({
  value,
  label,
  valueClassName = pillValueTextClass,
  labelClassName = pillLabelTextClass,
  align = 'start',
}) => (
  <div
    className={`pointer-events-none flex h-full items-center ${
      align === 'end' ? 'justify-end pr-3' : 'pl-3'
    }`}
  >
    <span className="flex min-w-0 items-baseline gap-2 truncate">
      <span
        className={`truncate text-[11px] font-semibold tracking-[0.02em] ${valueClassName}`}
      >
        {value}
      </span>
      <span
        className={`truncate text-[10px] font-medium uppercase tracking-[0.12em] ${labelClassName}`}
      >
        {label}
      </span>
    </span>
  </div>
);

export const IncomeAllocationChart: React.FC<IncomeAllocationChartProps> = ({
  annualIncomeSummary,
  annualEssentialSummary,
  annualFunsiesSummary,
  annualWealthSummary,
  essentialWidth,
  funsiesWidth,
  savingsWidth,
  essentialBudget,
  funsiesBudget,
  savingsForAllocation,
  essentialIncomePercent,
  funsiesIncomePercent,
  wealthIncomePercent,
  isWealthExpanded,
  onWealthToggle,
  plannedSavings,
  investments,
  savingsIncomePercent,
  investmentIncomePercent,
}) => {
  const wealthBreakdownClass = paletteGreen;
  const wealthOffset = essentialWidth + funsiesWidth;
  const totalWealth = plannedSavings + investments;
  const savingsShareOfWealth =
    totalWealth > 0 ? plannedSavings / totalWealth : 0;
  const investmentShareOfWealth =
    totalWealth > 0 ? investments / totalWealth : 0;
  const wealthGap = isWealthExpanded ? Math.min(0.7, savingsWidth * 0.08) : 0;
  const wealthAvailableWidth = Math.max(savingsWidth - wealthGap, 0);
  const savingsBreakdownWidth = wealthAvailableWidth * savingsShareOfWealth;
  const investmentBreakdownWidth =
    wealthAvailableWidth * investmentShareOfWealth;
  const investmentBreakdownOffset =
    wealthOffset + savingsBreakdownWidth + wealthGap;
  const annualSavingsSummary = formatWholeCurrency(plannedSavings * 12);
  const annualInvestmentSummary = formatWholeCurrency(investments * 12);

  return (
    <div
      className={`flex flex-1 flex-col justify-start pt-0 ${compactCardContentHeight}`}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
          <span>
            <span className="text-gray-600">{annualIncomeSummary}</span> income /{' '}
            <span className="text-gray-600">{annualEssentialSummary}</span>{' '}
            essential spending /{' '}
            <span className="text-gray-600">{annualFunsiesSummary}</span>{' '}
            funsies spending /{' '}
            <span className="text-gray-600">{annualWealthSummary}</span> wealth
            contribution
          </span>
        </div>
      </div>
      <div className="mt-2">
        <div className="relative h-8 overflow-visible">
          <AnimatePresence initial={false}>
            {isWealthExpanded ? (
              <motion.div
                id="wealth-breakdown-bars"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 bottom-[calc(100%+0.625rem)] z-10 h-8 overflow-visible"
              >
                <div className="relative h-8">
                  {savingsBreakdownWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Savings',
                        plannedSavings,
                        savingsIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className={`absolute inset-y-0 overflow-hidden ${wealthBreakdownClass}`}
                        style={{
                          left: `${wealthOffset}%`,
                          width: `${savingsBreakdownWidth}%`,
                        }}
                        aria-label="Savings breakdown bar"
                      >
                        <SegmentLabel
                          value={annualSavingsSummary}
                          label="Savings"
                        />
                      </div>
                    </Tooltip>
                  ) : null}
                  {investmentBreakdownWidth > 0 ? (
                    <Tooltip
                      content={getBarTooltipContent(
                        'Budgeted investments',
                        investments,
                        investmentIncomePercent,
                      )}
                      stacked
                      followCursor
                    >
                      <div
                        className={`absolute inset-y-0 overflow-hidden rounded-r-full ${wealthBreakdownClass}`}
                        style={{
                          left: `${investmentBreakdownOffset}%`,
                          width: `${investmentBreakdownWidth}%`,
                        }}
                        aria-label="Budgeted investments breakdown bar"
                      >
                        <SegmentLabel
                          value={annualInvestmentSummary}
                          label="Investments"
                        />
                      </div>
                    </Tooltip>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 h-8 overflow-hidden rounded-full bg-slate-100">
            <div className="absolute inset-y-0 left-0 w-full rounded-full bg-slate-200" />
            <div
              className={`absolute inset-y-0 left-0 overflow-hidden ${paletteBlue}`}
              style={{ width: `${essentialWidth}%` }}
            >
              <SegmentLabel value={annualEssentialSummary} label="Essential" />
            </div>
            <div
              className={`absolute inset-y-0 overflow-hidden ${palettePurple}`}
              style={{ left: `${essentialWidth}%`, width: `${funsiesWidth}%` }}
            >
              <SegmentLabel value={annualFunsiesSummary} label="Funsies" />
            </div>
            <div
              className={`absolute inset-y-0 overflow-hidden ${paletteGreen} transition-all ${
                isWealthExpanded
                  ? 'shadow-[0_0_0_2px_rgba(255,255,255,0.9),0_0_0_3px_rgba(34,197,94,0.25)]'
                  : ''
              }`}
              style={{
                left: `${wealthOffset}%`,
                width: `${savingsWidth}%`,
              }}
            >
              <SegmentLabel value={annualWealthSummary} label="Wealth" />
            </div>
            {essentialWidth > 0 ? (
              <Tooltip
                content={getBarTooltipContent(
                  'Essential Spending',
                  essentialBudget,
                  essentialIncomePercent,
                )}
                stacked
                followCursor
              >
                <div
                  className="absolute inset-y-0 left-0 cursor-pointer"
                  style={{ width: `${essentialWidth}%` }}
                  aria-label="Essential portion"
                />
              </Tooltip>
            ) : null}
            {funsiesWidth > 0 ? (
              <Tooltip
                content={getBarTooltipContent(
                  'Funsies Spending',
                  funsiesBudget,
                  funsiesIncomePercent,
                )}
                stacked
                followCursor
              >
                <div
                  className="absolute inset-y-0 cursor-pointer"
                  style={{ left: `${essentialWidth}%`, width: `${funsiesWidth}%` }}
                  aria-label="Funsies portion"
                />
              </Tooltip>
            ) : null}
            {savingsWidth > 0 ? (
              <Tooltip
                content={getBarTooltipContent(
                  'Wealth Contribution',
                  savingsForAllocation,
                  wealthIncomePercent,
                )}
                stacked
                followCursor
              >
                <button
                  type="button"
                  className="absolute inset-y-0 cursor-pointer rounded-r-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:ring-inset"
                  style={{
                    left: `${wealthOffset}%`,
                    width: `${savingsWidth}%`,
                  }}
                  aria-label={
                    isWealthExpanded
                      ? 'Collapse wealth contribution breakdown'
                      : 'Expand wealth contribution breakdown'
                  }
                  aria-expanded={isWealthExpanded}
                  aria-controls="wealth-breakdown-bars"
                  onClick={onWealthToggle}
                />
              </Tooltip>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
