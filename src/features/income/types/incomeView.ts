import type {
  CreateIncomeOccurrenceInput,
  CreateRecurringIncomeVersionInput,
  IncomeOccurrence,
  IncomeProjectionTotals,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
} from './income';

export interface AddSourceModalSubmit {
  sourceName: string;
  grossAmount: number;
  netAmount: number;
  periodsPerYear: number;
  startDate: string;
}

export interface AddBonusModalSubmit {
  existingBonusComponentId: number | null;
  label: string;
  occurrence: CreateIncomeOccurrenceInput;
}

export interface EditBonusModalSubmit {
  componentId: number;
  label: string;
  occurrence: CreateIncomeOccurrenceInput;
}

export type IncomeViewModalState =
  | { type: 'add-source' }
  | { type: 'rename-source'; source: ProjectedIncomeSource }
  | { type: 'add-version'; component: ProjectedIncomeComponent }
  | {
      type: 'edit-version';
      component: ProjectedIncomeComponent;
      version: RecurringIncomeVersion;
    }
  | { type: 'add-bonus'; source: ProjectedIncomeSource }
  | {
      type: 'edit-bonus';
      component: ProjectedIncomeComponent;
      occurrence: IncomeOccurrence;
    };

export interface ActionMenuPosition {
  top: number;
  left: number;
}

export const EMPTY_PROJECTION_TOTALS: IncomeProjectionTotals = {
  committedGross: 0,
  committedNet: 0,
  plannedGross: 0,
  plannedNet: 0,
  committedDeductions: {
    federalTax: 0,
    stateTax: 0,
    fica: 0,
    retirement: 0,
    healthInsurance: 0,
    other: 0,
    total: 0,
  },
  plannedDeductions: {
    federalTax: 0,
    stateTax: 0,
    fica: 0,
    retirement: 0,
    healthInsurance: 0,
    other: 0,
    total: 0,
  },
};

export function isAddBonusModalSubmit(
  payload: AddBonusModalSubmit | EditBonusModalSubmit,
): payload is AddBonusModalSubmit {
  return 'existingBonusComponentId' in payload;
}

export function isEditBonusModalSubmit(
  payload: AddBonusModalSubmit | EditBonusModalSubmit,
): payload is EditBonusModalSubmit {
  return 'componentId' in payload;
}

export type RecurringVersionModalSubmit = (
  targetId: number,
  input: CreateRecurringIncomeVersionInput,
) => Promise<void>;

export type BonusOccurrenceModalSubmit = (
  targetId: number,
  payload: AddBonusModalSubmit | EditBonusModalSubmit,
) => Promise<void>;
