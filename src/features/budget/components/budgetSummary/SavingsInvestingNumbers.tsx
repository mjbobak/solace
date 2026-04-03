import React from 'react';
import { LuEqual, LuPlus } from 'react-icons/lu';

import { palettePurpleText, palettePurpleTextMuted } from './constants';
import { CurrencyStack } from './SummaryCardChrome';

interface SavingsInvestingNumbersProps {
  plannedSavings: number;
  investments: number;
  totalWealth: number;
  wealthRate: number;
}

export const SavingsInvestingNumbers: React.FC<SavingsInvestingNumbersProps> = ({
  plannedSavings,
  investments,
  totalWealth,
  wealthRate,
}) => (
  <div className="space-y-2">
    <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-xs text-gray-500 xl:flex-nowrap">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Savings
        </p>
        <div className="mt-2">
          <CurrencyStack monthlyAmount={plannedSavings} />
        </div>
      </div>
      <div className="pt-7 text-slate-400" aria-hidden="true">
        <LuPlus className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          Budgeted Investments
        </p>
        <div className="mt-2">
          <CurrencyStack monthlyAmount={investments} />
        </div>
      </div>
      <div className="pt-7 text-slate-400" aria-hidden="true">
        <LuEqual className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-[10rem]">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${palettePurpleText}`}
        >
          Total Going to Wealth
        </p>
        <div className="mt-2">
          <CurrencyStack
            monthlyAmount={totalWealth}
            annualClassName={`text-lg font-bold ${palettePurpleText}`}
            monthlyClassName={`text-xs ${palettePurpleTextMuted}`}
          />
        </div>
      </div>
    </div>

    <div>
      <p className="text-xs font-medium text-gray-500">
        {wealthRate.toFixed(1)}% of income
      </p>
    </div>
  </div>
);
