import React from 'react';

import {
  compactCardContentHeight,
  paletteGreen,
  palettePurple,
  palettePurpleText,
} from './constants';
import { CurrencyStack } from './SummaryCardChrome';

interface IncomeAllocationNumbersProps {
  income: number;
  essentialBudget: number;
  funsiesBudget: number;
  savingsForAllocation: number;
  wealthRate: number;
  plannedSavings: number;
  investments: number;
}

export const IncomeAllocationNumbers: React.FC<IncomeAllocationNumbersProps> = ({
  income,
  essentialBudget,
  funsiesBudget,
  savingsForAllocation,
  wealthRate,
  plannedSavings,
  investments,
}) => (
  <div className={`pt-2 ${compactCardContentHeight}`}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Income</p>
        <CurrencyStack monthlyAmount={income} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Essential</p>
        <CurrencyStack monthlyAmount={essentialBudget} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Funsies</p>
        <CurrencyStack monthlyAmount={funsiesBudget} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Wealth</p>
        <CurrencyStack monthlyAmount={savingsForAllocation} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Wealth Rate</p>
        <p className="text-base font-bold text-gray-900">{wealthRate.toFixed(0)}%</p>
        <p className="text-[11px] text-gray-500">of income</p>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-xs text-slate-600">
        <span className={`h-2.5 w-2.5 rounded-full ${paletteGreen}`} />
        <span>Savings</span>
        <span className="font-semibold text-slate-900">
          {((plannedSavings / savingsForAllocation) * 100 || 0).toFixed(0)}%
        </span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50/80 px-3 py-1.5 text-xs text-slate-600">
        <span className={`h-2.5 w-2.5 rounded-full ${palettePurple}`} />
        <span>Budgeted Investments</span>
        <span className={`font-semibold ${palettePurpleText}`}>
          {((investments / savingsForAllocation) * 100 || 0).toFixed(0)}%
        </span>
      </div>
    </div>
  </div>
);
