export interface SpendingEntry {
  id: string;
  account: string;
  transactionDate: string;
  postDate: string;
  description: string;
  budgetLabel: string;
  budgetId?: number | null;
  budgetCategory?: string;
  budgetType?: string;
  amount: number;
  isAccrual?: boolean;
  spreadStartDate?: string | null;
  spreadMonths?: number | null;
}

export type YearFilter = string[]; // ['2024', '2023', etc.] - empty array = show all
export type MonthFilter = string[]; // ['1'-'12'] - empty array = show all

export interface SpendingFilters {
  year: YearFilter;
  month: MonthFilter;
  accounts: string[];
  budgetCategories: string[];
  budgetId?: number;
  accrualStatus: string[]; // ['YES', 'NO'] - empty array = show all
  amountMin?: number;
  amountMax?: number;
  forceEmpty?: boolean;
  searchQuery: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
}
