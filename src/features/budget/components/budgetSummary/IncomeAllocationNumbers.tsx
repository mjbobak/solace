import React from 'react';

import {
  compactCardContentHeight,
  compactSummaryLabelClass,
  compactSummaryMetaClass,
} from './constants';
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
  <div className={`pt-0 ${compactCardContentHeight}`}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <p className={compactSummaryLabelClass}>Income</p>
        <CurrencyStack monthlyAmount={income} compact />
      </div>
      <div>
        <p className={compactSummaryLabelClass}>Essential</p>
        <CurrencyStack monthlyAmount={essentialBudget} compact />
      </div>
      <div>
        <p className={compactSummaryLabelClass}>Funsies</p>
        <CurrencyStack monthlyAmount={funsiesBudget} compact />
      </div>
      <div>
        <p className={compactSummaryLabelClass}>Wealth</p>
        <CurrencyStack monthlyAmount={savingsForAllocation} compact />
      </div>
      <div>
        <p className={compactSummaryLabelClass}>Wealth Rate</p>
        <p className="text-base font-bold text-gray-900">{wealthRate.toFixed(0)}%</p>
        <p className={compactSummaryMetaClass}>of income</p>
      </div>
    </div>
  </div>
);
