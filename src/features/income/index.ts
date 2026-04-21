export { IncomeView } from './components/IncomeView';
export type { IncomeViewHandle } from './components/IncomeView';
export { IncomeSummary } from './components/IncomeSummary';

export type {
  AnnualAdjustment,
  AnnualAdjustmentStatus,
  AnnualAdjustmentTotals,
  CreateAnnualAdjustmentInput,
  CreateIncomeComponentInput,
  CreateIncomeOccurrenceInput,
  CreateIncomeSourceInput,
  CreateRecurringIncomeVersionInput,
  IncomeComponent,
  IncomeComponentMode,
  IncomeComponentType,
  IncomeOccurrence,
  IncomeOccurrenceStatus,
  IncomeProjectionTotals,
  IncomeSource,
  TaxAdvantagedBucketEntry,
  TaxAdvantagedBucketType,
  IncomeYearSettings,
  IncomeYearProjection,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
  TaxAdvantagedInvestments,
  UpdateAnnualAdjustmentInput,
  UpdateIncomeYearSettingsInput,
  UpdateIncomeSourceInput,
} from './types/income';

export {
  getAnnualAdjustmentStatusLabel,
  getComponentDisplayName,
  getComponentTypeLabel,
} from './types/income';
export { incomeApiService } from './services/incomeApiService';
