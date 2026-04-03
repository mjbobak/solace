import React from 'react';

import { compactCardContentHeight } from './constants';
import { CurrencyStack } from './SummaryCardChrome';

interface BudgetUtilizationNumbersProps {
  income: number;
  budgetedForChart: number;
  spentForChart: number;
  remainingForChart: number;
  remainingTotal: number;
  usedPercent: number;
}

export const BudgetUtilizationNumbers: React.FC<BudgetUtilizationNumbersProps> = ({
  income,
  budgetedForChart,
  spentForChart,
  remainingForChart,
  remainingTotal,
  usedPercent,
}) => (
  <div className={`pt-2 ${compactCardContentHeight}`}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Income</p>
        <CurrencyStack monthlyAmount={income} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Budgeted</p>
        <CurrencyStack monthlyAmount={budgetedForChart} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Spent</p>
        <CurrencyStack monthlyAmount={spentForChart} compact />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Remaining</p>
        <CurrencyStack
          monthlyAmount={remainingForChart}
          annualClassName={remainingTotal < 0 ? 'text-red-600' : 'text-gray-900'}
          monthlyClassName={remainingTotal < 0 ? 'text-red-600/75' : 'text-gray-500'}
          compact
        />
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Percent Used</p>
        <p
          className={`text-base font-bold ${
            usedPercent > 100 ? 'text-red-600' : 'text-gray-900'
          }`}
        >
          {usedPercent.toFixed(0)}%
        </p>
        <p className="text-[11px] text-gray-500">of budgeted amount</p>
      </div>
    </div>
  </div>
);
