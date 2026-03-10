import type { SpendingEntry } from '../types/spendingView';
import { getMonthlyTransactionImpacts } from '../utils/spreadPayments';

export const MONTHS = [
  { value: 'ALL', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const;

export const ACCRUAL_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All Payment Spreads' },
  { value: 'YES', label: 'Spread Only' },
  { value: 'NO', label: 'Not Spread' },
];

export const PAGINATION_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const FILTERABLE_FIELDS = [
  {
    type: 'year' as const,
    label: 'Year',
    description: 'Filter by transaction year',
  },
  {
    type: 'month' as const,
    label: 'Month',
    description: 'Filter by transaction month',
  },
  {
    type: 'accounts' as const,
    label: 'Account',
    description: 'Filter by bank account',
  },
  {
    type: 'budgetCategories' as const,
    label: 'Budget Category',
    description: 'Filter by budget category',
  },
  {
    type: 'accrualStatus' as const,
    label: 'Payment Spread',
    description: 'Filter by payment spread status',
  },
  {
    type: 'amountRange' as const,
    label: 'Amount Range',
    description: 'Filter by transaction amount',
  },
] as const;

export function generateYearOptions(
  transactions: SpendingEntry[],
): { value: string; label: string }[] {
  const yearsSet = new Set<string>();
  for (const transaction of transactions) {
    for (const impact of getMonthlyTransactionImpacts(transaction)) {
      yearsSet.add(impact.year.toString());
    }
  }
  const years = Array.from(yearsSet).sort().reverse();

  return [
    { value: 'ALL', label: 'All Years' },
    ...years.map((year) => ({ value: year, label: year })),
  ];
}
