import React from 'react';

import { formatWholeCurrency } from './constants';
import { compactCardContentHeight } from './constants';

interface BudgetUtilizationNumbersProps {
  income: number;
  budgetedForChart: number;
  spentForChart: number;
  remainingForChart: number;
  remainingTotal: number;
  usedPercent: number;
  amountContextLabel: string;
}

export const BudgetUtilizationNumbers: React.FC<BudgetUtilizationNumbersProps> = ({
  income,
  budgetedForChart,
  spentForChart,
  remainingForChart,
  remainingTotal,
  usedPercent,
  amountContextLabel,
}) => (
  <div className={`pt-2 ${compactCardContentHeight}`}>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Income</p>
        <p className="text-base font-bold text-gray-900">
          {formatWholeCurrency(income)}
        </p>
        <p className="text-[11px] text-gray-500">{amountContextLabel}</p>
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Budgeted</p>
        <p className="text-base font-bold text-gray-900">
          {formatWholeCurrency(budgetedForChart)}
        </p>
        <p className="text-[11px] text-gray-500">{amountContextLabel}</p>
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Spent</p>
        <p className="text-base font-bold text-gray-900">
          {formatWholeCurrency(spentForChart)}
        </p>
        <p className="text-[11px] text-gray-500">{amountContextLabel}</p>
      </div>
      <div>
        <p className="mb-1 text-[11px] text-gray-500">Remaining</p>
        <p
          className={`text-base font-bold ${
            remainingTotal < 0 ? 'text-red-600' : 'text-gray-900'
          }`}
        >
          {formatWholeCurrency(remainingForChart)}
        </p>
        <p
          className={`text-[11px] ${
            remainingTotal < 0 ? 'text-red-600/75' : 'text-gray-500'
          }`}
        >
          {amountContextLabel}
        </p>
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
