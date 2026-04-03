import React from 'react';

import { compactCardContentHeight } from './constants';
import { CurrencyStack } from './SummaryCardChrome';

interface IncomeAllocationNumbersProps {
  income: number;
  essentialBudget: number;
  funsiesBudget: number;
  savingsForAllocation: number;
  wealthRate: number;
}

export const IncomeAllocationNumbers: React.FC<IncomeAllocationNumbersProps> = ({
  income,
  essentialBudget,
  funsiesBudget,
  savingsForAllocation,
  wealthRate,
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
        <p className="mb-1 text-[11px] text-gray-500">Savings</p>
        <CurrencyStack monthlyAmount={savingsForAllocation} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Wealth Rate</p>
        <p className="text-base font-bold text-gray-900">{wealthRate.toFixed(0)}%</p>
        <p className="text-[11px] text-gray-500">of income</p>
      </div>
    </div>
  </div>
);
