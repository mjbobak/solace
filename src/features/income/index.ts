/**
 * Public API exports for the income feature
 * Other features should only import from this file
 */

// Components
export { IncomeView } from './components/IncomeView';
export type { IncomeViewHandle } from './components/IncomeView';
export { IncomeSummary } from './components/IncomeSummary';
export { IncomeTable } from './components/IncomeTable';
export { IncomeTypeIcon } from './components/IncomeTypeIcon';
export { IncomeFrequencyBadge } from './components/IncomeFrequencyBadge';
export { AddIncomeModal } from './components/AddIncomeModal/index';

// Types
export type {
  IncomeEntry,
  EffectiveDateRange,
  Deductions,
} from './types/income';
export { calculateAnnualGross, calculateAnnualNet } from './types/income';
export type {
  IncomePeriod,
  IncomeDisplayType,
  IncomeWithCalculations,
  IncomeTotals,
  GroupedIncomeEntry,
  EffectiveDateRangeWithEntry,
  DisplayValues,
} from './types/incomeView';

// Hooks
export { useIncomeFiltering } from './hooks/useIncomeFiltering';
export { useIncomeCalculations } from './hooks/useIncomeCalculations';
export { useIncomeGrouping } from './hooks/useIncomeGrouping';
export { useIncomeOperations } from './hooks/useIncomeOperations';
export { useIncomeVisualizationData } from './hooks/useIncomeVisualizationData';
export { useIncomeStreamData } from './hooks/useIncomeStreamData';

// Constants
export {
  INPUT_TYPES,
  INCOME_TYPES,
  INCOME_FREQUENCIES,
  PAY_PERIODS_OPTIONS,
} from './constants/incomeConfig';
export { getIncomeIcon } from './constants/incomeIcons';
