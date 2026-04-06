import { getTodayDateOnly } from '@/shared/utils/dateOnly';

import type { SpendingEntry } from '../types/spendingView';

// API response type from backend
interface TransactionAPI {
  id: number;
  date: string;
  post_date: string | null;
  description: string;
  merchant: string | null;
  amount: string | number;
  account: string | null;
  budget_id: number | null;
  budget_label: string | null;
  budget_category: string | null;
  budget_type: string | null;
  is_accrual: boolean;
  spread_start_date: string | null;
  spread_months: number | null;
  status: string;
  review_status: string;
  import_batch_id: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface TransactionQueryOptions {
  skip?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface GetTransactionsOptions extends TransactionQueryOptions {
  fetchAll?: boolean;
}

type TransactionUpdatePayload = {
  date?: string;
  post_date?: string;
  description?: string;
  merchant?: string;
  amount?: number;
  account?: string;
  budget_id?: number | null;
  is_accrual?: boolean;
  spread_start_date?: string | null;
  spread_months?: number | null;
};

interface BulkTransactionUpdate {
  id: string;
  updates: Partial<SpendingEntry>;
}

const TRANSACTIONS_API_BASE = '/api/transactions';
const DEFAULT_PAGE_SIZE = 500;

// Map API response to frontend SpendingEntry
function mapApiToSpendingEntry(apiData: TransactionAPI): SpendingEntry {
  return {
    id: apiData.id.toString(),
    account: apiData.account || 'Unknown',
    transactionDate: apiData.date,
    postDate: apiData.post_date || apiData.date,
    description: apiData.description,
    budgetLabel: apiData.budget_label || 'Uncategorized',
    budgetId: apiData.budget_id,
    budgetCategory: apiData.budget_category || undefined,
    budgetType: apiData.budget_type || undefined,
    amount:
      typeof apiData.amount === 'string'
        ? parseFloat(apiData.amount)
        : apiData.amount,
    isAccrual: apiData.is_accrual,
    spreadStartDate: apiData.spread_start_date,
    spreadMonths: apiData.spread_months,
  };
}

function buildTransactionsUrl(options?: TransactionQueryOptions): string {
  const params = new URLSearchParams();

  if (options?.skip !== undefined) {
    params.append('skip', String(options.skip));
  }
  if (options?.limit !== undefined) {
    params.append('limit', String(options.limit));
  }
  if (options?.startDate) {
    params.append('start_date', options.startDate);
  }
  if (options?.endDate) {
    params.append('end_date', options.endDate);
  }

  const query = params.toString();
  return query ? `${TRANSACTIONS_API_BASE}?${query}` : TRANSACTIONS_API_BASE;
}

async function fetchTransactionsPage(
  options?: TransactionQueryOptions,
): Promise<SpendingEntry[]> {
  const response = await fetch(buildTransactionsUrl(options));
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }

  const data = (await response.json()) as TransactionAPI[];
  return data.map(mapApiToSpendingEntry);
}

async function fetchAllTransactions(
  options?: TransactionQueryOptions,
): Promise<SpendingEntry[]> {
  const pageSize = options?.limit ?? DEFAULT_PAGE_SIZE;
  const all: SpendingEntry[] = [];
  let skip = options?.skip ?? 0;

  while (true) {
    const page = await fetchTransactionsPage({
      ...options,
      skip,
      limit: pageSize,
    });

    all.push(...page);

    if (page.length < pageSize) {
      break;
    }

    skip += pageSize;
  }

  return all;
}

// Map frontend SpendingEntry to API request
function mapSpendingEntryToApi(
  entry: Omit<SpendingEntry, 'id'> | Partial<SpendingEntry>,
): TransactionUpdatePayload {
  const apiEntry: TransactionUpdatePayload = {};

  const setField = <K extends keyof TransactionUpdatePayload>(
    key: K,
    value: TransactionUpdatePayload[K],
  ) => {
    apiEntry[key] = value;
  };

  if ('transactionDate' in entry) {
    setField('date', entry.transactionDate);
  }
  if ('postDate' in entry) {
    setField('post_date', entry.postDate);
  }
  if ('description' in entry) {
    setField('description', entry.description);
    setField('merchant', entry.description); // Use description as merchant for now
  }
  if ('amount' in entry) {
    setField('amount', entry.amount);
  }
  if ('account' in entry) {
    setField('account', entry.account);
  }
  if ('budgetId' in entry) {
    setField('budget_id', entry.budgetId ?? null);
  }
  if ('isAccrual' in entry) {
    setField('is_accrual', entry.isAccrual ?? false);
  }
  if ('spreadStartDate' in entry) {
    setField('spread_start_date', entry.spreadStartDate ?? null);
  }
  if ('spreadMonths' in entry) {
    setField('spread_months', entry.spreadMonths ?? null);
  }

  return apiEntry;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

function csvRowToTransaction(
  row: Record<string, string>,
): Omit<SpendingEntry, 'id'> {
  const fallbackDate = getTodayDateOnly();

  // Map common CSV headers to SpendingEntry fields
  const getField = (fieldNames: string[]): string => {
    return row[fieldNames.find((name) => row[name]) || ''] || '';
  };

  return {
    account: getField(['account', 'bank', 'from account']),
    transactionDate:
      getField(['date', 'transaction date', 'transactiondate']) || fallbackDate,
    postDate: getField(['post date', 'postdate', 'date']) || fallbackDate,
    description: getField(['description', 'merchant', 'name', 'payee']),
    budgetLabel: 'Uncategorized',
    amount: parseFloat(getField(['amount', 'value', 'debit', 'credit'])) || 0,
    isAccrual: false,
    spreadStartDate: null,
    spreadMonths: null,
  };
}

async function runBulkTransactionUpdates(
  updatesByTransaction: BulkTransactionUpdate[],
): Promise<SpendingEntry[]> {
  const updatePromises = updatesByTransaction.map(({ id, updates }) =>
    fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapSpendingEntryToApi(updates)),
    }),
  );

  const results = await Promise.all(updatePromises);
  const updatedTransactions: SpendingEntry[] = [];

  for (const result of results) {
    if (!result.ok) {
      throw new Error(`Failed to update transaction: ${result.statusText}`);
    }

    const apiResponse = (await result.json()) as TransactionAPI;
    updatedTransactions.push(mapApiToSpendingEntry(apiResponse));
  }

  return updatedTransactions;
}

// API client for transactions
export const spendingService = {
  getAllTransactions: async (
    options?: GetTransactionsOptions,
  ): Promise<SpendingEntry[]> => {
    try {
      const shouldFetchAll = options?.fetchAll ?? options?.limit === undefined;

      if (shouldFetchAll) {
        return await fetchAllTransactions(options);
      }

      return await fetchTransactionsPage(options);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  getTransactionsByDateRange: async (
    startDate: string,
    endDate: string,
  ): Promise<SpendingEntry[]> => {
    return spendingService.getAllTransactions({
      startDate,
      endDate,
      fetchAll: true,
    });
  },

  createTransaction: async (
    entry: Omit<SpendingEntry, 'id'>,
  ): Promise<SpendingEntry> => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapSpendingEntryToApi(entry)),
      });

      if (!response.ok) {
        throw new Error(`Failed to create transaction: ${response.statusText}`);
      }

      const apiResponse = (await response.json()) as TransactionAPI;
      return mapApiToSpendingEntry(apiResponse);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  uploadTransactions: async (file: File): Promise<SpendingEntry[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const rows = parseCSV(content);

          // Filter valid rows (must have description and amount)
          const validRows = rows.filter((row) => row.description && row.amount);

          if (validRows.length === 0) {
            reject(new Error('No valid transactions found in CSV file'));
            return;
          }

          // Convert CSV rows to SpendingEntry format (without IDs)
          const entries = validRows.map((row) => {
            return csvRowToTransaction(row); // Returns SpendingEntry without ID
          });

          // Create all transactions via API
          const createPromises = entries.map((entry) =>
            spendingService.createTransaction(entry).catch((error) => {
              console.error('Failed to create transaction:', error);
              return null; // Continue with next transaction if one fails
            }),
          );

          const results = await Promise.all(createPromises);
          const successfulTransactions = results.filter(
            (t) => t !== null,
          ) as SpendingEntry[];

          resolve(successfulTransactions);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  },

  updateTransaction: async (
    id: string,
    updates: Partial<SpendingEntry>,
  ): Promise<SpendingEntry> => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapSpendingEntryToApi(updates)),
      });

      if (!response.ok) {
        throw new Error(`Failed to update transaction: ${response.statusText}`);
      }

      const apiResponse = (await response.json()) as TransactionAPI;
      return mapApiToSpendingEntry(apiResponse);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete transaction: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  bulkDeleteTransactions: async (ids: string[]): Promise<void> => {
    try {
      // Delete each transaction individually
      // TODO: Implement bulk delete endpoint on backend for better performance
      const deletePromises = ids.map((id) =>
        fetch(`/api/transactions/${id}`, { method: 'DELETE' }),
      );

      const results = await Promise.all(deletePromises);

      // Check if all deletions were successful
      for (const result of results) {
        if (!result.ok) {
          throw new Error(`Failed to delete transaction: ${result.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error bulk deleting transactions:', error);
      throw error;
    }
  },

  bulkUpdateTransactions: async (
    ids: string[],
    updates: Partial<SpendingEntry>,
  ): Promise<SpendingEntry[]> => {
    try {
      // Update each transaction individually
      // TODO: Implement bulk update endpoint on backend for better performance
      return await runBulkTransactionUpdates(
        ids.map((id) => ({ id, updates })),
      );
    } catch (error) {
      console.error('Error bulk updating transactions:', error);
      throw error;
    }
  },

  bulkUpdateTransactionsIndividually: async (
    updatesByTransaction: BulkTransactionUpdate[],
  ): Promise<SpendingEntry[]> => {
    try {
      return await runBulkTransactionUpdates(updatesByTransaction);
    } catch (error) {
      console.error('Error bulk updating transactions:', error);
      throw error;
    }
  },
};
