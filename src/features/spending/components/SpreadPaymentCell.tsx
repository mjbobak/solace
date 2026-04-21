import React from 'react';
import { BiRepeat } from 'react-icons/bi';

import type { SpendingEntry } from '@/features/spending/types/spendingView';
import {
  formatSpreadRangeLabel,
  getAverageSpreadAmount,
  getImpactForMonth,
  getSpreadPaymentConfig,
} from '@/features/spending/utils/spreadPayments';
import { Tooltip } from '@/shared/components/Tooltip';
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
  const spreadRangeLabel = spreadConfig
    ? formatSpreadRangeLabel(spreadConfig)
    : null;

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

  const tooltipContent = [
    spreadRangeLabel,
    averageAmount !== null ? `${formatCurrency(averageAmount)}/mo avg` : null,
    displayMonth && displayImpact !== 0
      ? `${displayMonth.label}: ${formatCurrency(displayImpact)}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <Tooltip content={tooltipContent} stacked>
      <button
        onClick={(event) => onEdit(transaction, event.currentTarget)}
        className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full bg-purple-50 px-2.5 py-1 text-left text-xs font-medium text-purple-900 ring-1 ring-inset ring-purple-300 transition-all hover:bg-purple-100"
        title="Edit payment spread"
      >
        <BiRepeat size={14} className="shrink-0" />
        <span className="truncate">{spreadRangeLabel}</span>
      </button>
    </Tooltip>
  );
};
