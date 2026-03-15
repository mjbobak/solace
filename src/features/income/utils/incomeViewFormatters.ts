import { formatCurrency } from '@/shared/utils/currency';
import {
  formatDateOnly,
  parseDateOnly,
  toDateOnlyString,
} from '@/shared/utils/dateOnly';

import type {
  IncomeOccurrence,
  ProjectedIncomeComponent,
} from '../types/income';

export const OCCURRENCE_STATUS_BADGE_CLASSES: Record<
  IncomeOccurrence['status'],
  string
> = {
  actual:
    'bg-green-100 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-200',
  expected:
    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-200',
};

export function formatDate(value: string | null): string {
  if (!value) {
    return 'Present';
  }

  return formatDateOnly(value, 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatNetRangeSummary(
  component: ProjectedIncomeComponent,
): string {
  if (!component.currentVersion) {
    return formatCurrency(component.totals.plannedCashNet);
  }

  return `${formatCurrency(component.currentVersion.netAmount)} cash net x ${
    component.currentVersion.periodsPerYear
  }`;
}

export function getOccurrenceEventDate(occurrence: IncomeOccurrence): string {
  return occurrence.paidDate ?? occurrence.plannedDate;
}

export function getDefaultChangeStartDate(
  component: ProjectedIncomeComponent,
  selectedYear: number,
): string {
  if (component.currentVersion?.endDate) {
    const nextDate = parseDateOnly(component.currentVersion.endDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return toDateOnlyString(nextDate);
  }

  const today = new Date();
  if (today.getFullYear() === selectedYear) {
    return toDateOnlyString(today);
  }

  return `${selectedYear}-01-01`;
}
