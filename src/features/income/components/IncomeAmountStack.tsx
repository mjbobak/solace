import { formatCurrency } from '@/shared/utils/currency';

interface IncomeAmountStackProps {
  primaryValue: number;
  secondaryValue: number;
}

export function IncomeAmountStack({
  primaryValue,
  secondaryValue,
}: IncomeAmountStackProps) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-semibold text-app">
        {formatCurrency(primaryValue)}
      </span>
      <span className="mt-1 text-xs text-muted">
        {formatCurrency(secondaryValue)} Net
      </span>
    </div>
  );
}
