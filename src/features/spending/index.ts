// Components
export { SpendingView } from './components/SpendingView';
export type { SpendingViewHandle } from './components/SpendingView';

// Types
export type {
  SpendingEntry,
  YearFilter,
  MonthFilter,
  SpendingFilters,
  PaginationState,
} from './types/spendingView';

// Hooks
export { useSpendingFiltering } from './hooks/useSpendingFiltering';

// Services
export { spendingService } from './services/spendingService';

// Constants
export {
  MONTHS,
  ACCRUAL_STATUS_OPTIONS,
  PAGINATION_SIZE_OPTIONS,
  generateYearOptions,
} from './constants/spendingConfig';
