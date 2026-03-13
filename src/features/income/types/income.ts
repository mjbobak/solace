export type IncomeComponentType =
  | 'base_pay'
  | 'bonus'
  | 'commission'
  | 'overtime'
  | 'other';

export type IncomeComponentMode = 'recurring' | 'occurrence';
export type IncomeOccurrenceStatus = 'expected' | 'actual';

export interface DeductionBreakdown {
  federalTax?: number;
  stateTax?: number;
  fica?: number;
  retirement?: number;
  healthInsurance?: number;
  other?: number;
}

export interface DeductionTotals {
  federalTax: number;
  stateTax: number;
  fica: number;
  retirement: number;
  healthInsurance: number;
  other: number;
  total: number;
}

export interface IncomeProjectionTotals {
  committedGross: number;
  committedNet: number;
  plannedGross: number;
  plannedNet: number;
  committedDeductions: DeductionTotals;
  plannedDeductions: DeductionTotals;
}

export interface IncomeSource {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeComponent {
  id: number;
  sourceId: number;
  componentType: IncomeComponentType;
  componentMode: IncomeComponentMode;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringIncomeVersion {
  id: number;
  componentId: number;
  startDate: string;
  endDate: string | null;
  grossAmount: number;
  netAmount: number;
  periodsPerYear: number;
  deductions: DeductionBreakdown | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeOccurrence {
  id: number;
  componentId: number;
  status: IncomeOccurrenceStatus;
  plannedDate: string;
  paidDate: string | null;
  grossAmount: number;
  netAmount: number;
  deductions: DeductionBreakdown | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectedIncomeComponent extends IncomeComponent {
  totals: IncomeProjectionTotals;
  currentVersion: RecurringIncomeVersion | null;
  versions: RecurringIncomeVersion[];
  occurrences: IncomeOccurrence[];
}

export interface ProjectedIncomeSource extends IncomeSource {
  totals: IncomeProjectionTotals;
  components: ProjectedIncomeComponent[];
}

export interface IncomeYearProjection {
  year: number;
  totals: IncomeProjectionTotals;
  sources: ProjectedIncomeSource[];
}

export interface CreateIncomeSourceInput {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateIncomeSourceInput = Partial<CreateIncomeSourceInput>;

export interface CreateIncomeComponentInput {
  componentType: IncomeComponentType;
  componentMode: IncomeComponentMode;
  label?: string | null;
}

export type UpdateIncomeComponentInput = Partial<CreateIncomeComponentInput>;

export interface CreateRecurringIncomeVersionInput {
  startDate: string;
  endDate?: string | null;
  grossAmount: number;
  netAmount: number;
  periodsPerYear: number;
  deductions?: DeductionBreakdown | null;
}

export type UpdateRecurringIncomeVersionInput =
  Partial<CreateRecurringIncomeVersionInput>;

export interface CreateIncomeOccurrenceInput {
  status: IncomeOccurrenceStatus;
  plannedDate: string;
  paidDate?: string | null;
  grossAmount: number;
  netAmount: number;
  deductions?: DeductionBreakdown | null;
}

export type UpdateIncomeOccurrenceInput = Partial<CreateIncomeOccurrenceInput>;

export function getComponentDisplayName(component: ProjectedIncomeComponent): string {
  if (component.label?.trim()) {
    return component.label;
  }

  switch (component.componentType) {
    case 'base_pay':
      return 'Base pay';
    case 'bonus':
      return 'Bonus';
    case 'commission':
      return 'Commission';
    case 'overtime':
      return 'Overtime';
    default:
      return 'Other income';
  }
}

export function getComponentTypeLabel(type: IncomeComponentType): string {
  switch (type) {
    case 'base_pay':
      return 'Base pay';
    case 'bonus':
      return 'Bonus';
    case 'commission':
      return 'Commission';
    case 'overtime':
      return 'Overtime';
    default:
      return 'Other';
  }
}
