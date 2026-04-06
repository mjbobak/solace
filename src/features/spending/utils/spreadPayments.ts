import type { SpendingEntry } from '@/features/spending/types/spendingView';

export interface SpreadPaymentConfig {
  spreadStartDate: string;
  spreadMonths: number;
}

type SpreadPaymentEntry = Pick<
  SpendingEntry,
  | 'amount'
  | 'transactionDate'
  | 'spreadStartDate'
  | 'spreadMonths'
  | 'isAccrual'
>;

export interface MonthlyTransactionImpact {
  year: number;
  month: number;
  amount: number;
  monthStart: string;
}

export interface SpreadMonthRange {
  startMonth: string;
  endMonth: string;
}

function parseIsoDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMonthStart(dateString: string): string {
  const parsed = parseIsoDate(dateString);
  return toIsoDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
}

function addMonths(dateString: string, monthsToAdd: number): string {
  const parsed = parseIsoDate(dateString);
  return toIsoDate(
    new Date(parsed.getFullYear(), parsed.getMonth() + monthsToAdd, 1),
  );
}

export function toMonthInputValue(dateString: string): string {
  return toMonthStart(dateString).slice(0, 7);
}

export function monthInputToIsoDate(monthInput: string): string {
  return `${monthInput}-01`;
}

export function getFiscalYearMonthRange(
  transactionDate: string,
): SpreadMonthRange {
  const year = parseIsoDate(transactionDate).getFullYear();

  return {
    startMonth: `${year}-01`,
    endMonth: `${year}-12`,
  };
}

export function getInclusiveMonthCount(
  startMonthInput: string,
  endMonthInput: string,
): number {
  const [startYear, startMonth] = startMonthInput.split('-').map(Number);
  const [endYear, endMonth] = endMonthInput.split('-').map(Number);

  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

export function getSpreadPaymentConfig(
  entry: SpreadPaymentEntry,
): SpreadPaymentConfig | null {
  if (entry.spreadStartDate && entry.spreadMonths) {
    return {
      spreadStartDate: toMonthStart(entry.spreadStartDate),
      spreadMonths: entry.spreadMonths,
    };
  }

  if (entry.isAccrual) {
    return {
      spreadStartDate: toMonthStart(entry.transactionDate),
      spreadMonths: 12,
    };
  }

  return null;
}

export function hasSpreadPayment(entry: SpreadPaymentEntry): boolean {
  return getSpreadPaymentConfig(entry) !== null;
}

export function getSpreadEndDate(config: SpreadPaymentConfig): string {
  return addMonths(config.spreadStartDate, config.spreadMonths - 1);
}

export function getAverageSpreadAmount(
  entry: SpreadPaymentEntry,
): number | null {
  const config = getSpreadPaymentConfig(entry);
  if (!config) {
    return null;
  }

  return entry.amount / config.spreadMonths;
}

export function getMonthlyTransactionImpacts(
  entry: SpreadPaymentEntry,
): MonthlyTransactionImpact[] {
  const config = getSpreadPaymentConfig(entry);
  if (!config) {
    const transactionDate = parseIsoDate(entry.transactionDate);
    return [
      {
        year: transactionDate.getFullYear(),
        month: transactionDate.getMonth() + 1,
        amount: entry.amount,
        monthStart: toMonthStart(entry.transactionDate),
      },
    ];
  }

  const totalCents = Math.round(Math.abs(entry.amount) * 100);
  const sign = entry.amount < 0 ? -1 : 1;
  const baseCents = Math.floor(totalCents / config.spreadMonths);
  const remainder = totalCents % config.spreadMonths;

  return Array.from({ length: config.spreadMonths }, (_, index) => {
    const monthStart = addMonths(config.spreadStartDate, index);
    const parsedMonth = parseIsoDate(monthStart);
    const amountCents = baseCents + (index < remainder ? 1 : 0);

    return {
      year: parsedMonth.getFullYear(),
      month: parsedMonth.getMonth() + 1,
      amount: (amountCents / 100) * sign,
      monthStart,
    };
  });
}

export function getImpactForMonth(
  entry: SpreadPaymentEntry,
  year: number,
  month: number,
): number {
  const impact = getMonthlyTransactionImpacts(entry).find(
    (item) => item.year === year && item.month === month,
  );

  return impact?.amount ?? 0;
}

export function formatSpreadDateLabel(dateString: string): string {
  return parseIsoDate(dateString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

export function formatSpreadRangeLabel(config: SpreadPaymentConfig): string {
  const startDate = parseIsoDate(config.spreadStartDate);
  const endDate = parseIsoDate(getSpreadEndDate(config));
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startMonth} ${startYear}`;
    }

    return `${startMonth}-${endMonth} ${startYear}`;
  }

  return `${startMonth} ${startYear}-${endMonth} ${endYear}`;
}
