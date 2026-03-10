import React from 'react';
import { BiRepeat } from 'react-icons/bi';

import type { SpendingEntry } from '@/features/spending/types/spendingView';
import {
  formatSpreadRangeLabel,
  getAverageSpreadAmount,
  getImpactForMonth,
  getSpreadPaymentConfig,
} from '@/features/spending/utils/spreadPayments';
import { formatCurrency } from '@/shared/utils/currency';

interface SpreadPaymentCellProps {
  transaction: SpendingEntry;
  onEdit: (
    transaction: SpendingEntry,
    anchorElement: HTMLButtonElement,
  ) => void;
  displayMonth?: {
    year: number;
    month: number;
    label: string;
  } | null;
}

export const SpreadPaymentCell: React.FC<SpreadPaymentCellProps> = ({
  transaction,
  onEdit,
  displayMonth = null,
}) => {
  const spreadConfig = getSpreadPaymentConfig(transaction);
  const averageAmount = getAverageSpreadAmount(transaction);
  const displayImpact =
    displayMonth && spreadConfig
      ? getImpactForMonth(transaction, displayMonth.year, displayMonth.month)
      : 0;

  if (!spreadConfig) {
    return (
      <button
        onClick={(event) => onEdit(transaction, event.currentTarget)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer bg-gray-100 text-gray-600 hover:bg-gray-200"
        title="Spread this payment over multiple months"
      >
        <BiRepeat size={14} />
        Spread Payment
      </button>
    );
  }

  return (
    <button
      onClick={(event) => onEdit(transaction, event.currentTarget)}
      className="inline-flex flex-col items-start gap-0.5 rounded-xl border border-purple-300 bg-purple-50 px-3 py-2 text-left text-xs text-purple-900 transition-all hover:bg-purple-100"
      title="Edit payment spread"
    >
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <BiRepeat size={14} />
        {formatSpreadRangeLabel(spreadConfig)}
      </span>
      {averageAmount !== null && (
        <span className="text-purple-700">
          {formatCurrency(averageAmount)}/mo avg
        </span>
      )}
      {displayMonth && displayImpact !== 0 && (
        <span className="text-[11px] text-purple-600">
          {displayMonth.label}: {formatCurrency(displayImpact)}
        </span>
      )}
    </button>
  );
};
