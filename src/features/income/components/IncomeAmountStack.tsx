import { formatCurrency } from '@/shared/utils/currency';

interface IncomeAmountStackProps {
  primaryValue: number;
  secondaryValue: number;
  secondaryLabel?: string;
}

export function IncomeAmountStack({
  primaryValue,
  secondaryValue,
  secondaryLabel = 'Net',
}: IncomeAmountStackProps) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-semibold text-app">
        {formatCurrency(primaryValue)}
      </span>
      <span className="mt-1 text-xs text-muted">
        {formatCurrency(secondaryValue)} {secondaryLabel}
      </span>
    </div>
  );
}
