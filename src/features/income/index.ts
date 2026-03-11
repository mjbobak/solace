export { IncomeView } from './components/IncomeView';
export type { IncomeViewHandle } from './components/IncomeView';
export { IncomeSummary } from './components/IncomeSummary';

export type {
  CreateIncomeComponentInput,
  CreateIncomeOccurrenceInput,
  CreateIncomeSourceInput,
  CreateRecurringIncomeVersionInput,
  DeductionBreakdown,
  IncomeComponent,
  IncomeComponentMode,
  IncomeComponentType,
  IncomeOccurrence,
  IncomeOccurrenceStatus,
  IncomeProjectionTotals,
  IncomeSource,
  IncomeYearProjection,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
  UpdateIncomeSourceInput,
} from './types/income';

export { getComponentDisplayName, getComponentTypeLabel } from './types/income';
export { incomeApiService } from './services/incomeApiService';
