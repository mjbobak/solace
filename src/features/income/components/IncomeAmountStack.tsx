import { formatWholeCurrency } from '../utils/incomeViewFormatters';

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
      <span className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-app">
          {formatWholeCurrency(primaryValue)}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Annual
        </span>
      </span>
      <span className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-xs text-muted">
          {formatWholeCurrency(secondaryValue)}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Month
        </span>
      </span>
    </div>
  );
}
