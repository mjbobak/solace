export type IncomeComponentType =
  | 'base_pay'
  | 'bonus'
  | 'commission'
  | 'overtime'
  | 'other';

export type IncomeComponentMode = 'recurring' | 'occurrence';
export type IncomeOccurrenceStatus = 'expected' | 'actual';

export interface TaxAdvantagedInvestments {
  contributions401k: number;
  total: number;
}

export interface IncomeProjectionTotals {
  committedGross: number;
  committedNet: number;
  plannedGross: number;
  plannedNet: number;
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
  taxAdvantagedInvestments: TaxAdvantagedInvestments;
  sources: ProjectedIncomeSource[];
}

export interface IncomeYearSettings {
  year: number;
  contributions401k: number;
  createdAt: string;
  updatedAt: string;
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
}

export type UpdateRecurringIncomeVersionInput =
  Partial<CreateRecurringIncomeVersionInput>;

export interface CreateIncomeOccurrenceInput {
  status: IncomeOccurrenceStatus;
  plannedDate: string;
  paidDate?: string | null;
  grossAmount: number;
  netAmount: number;
}

export type UpdateIncomeOccurrenceInput = Partial<CreateIncomeOccurrenceInput>;

export interface UpdateIncomeYearSettingsInput {
  contributions401k: number;
}

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
