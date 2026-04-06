import { useState } from 'react';
import { toast } from 'sonner';

import { spendingService } from '@/features/spending/services/spendingService';
import type { SpendingEntry } from '@/features/spending/types/spendingView';
import {
  getFiscalYearMonthRange,
  monthInputToIsoDate,
} from '@/features/spending/utils/spreadPayments';

export function useBulkSpendingOperations(
  transactions: SpendingEntry[],
  setTransactions: React.Dispatch<React.SetStateAction<SpendingEntry[]>>,
) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Bulk delete transactions
   */
  const handleBulkDelete = async (ids: string[]) => {
    setIsLoading(true);

    // Optimistic update
    const previousTransactions = [...transactions];
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));

    try {
      await spendingService.bulkDeleteTransactions(ids);
      toast.success(
        `${ids.length} ${
          ids.length === 1 ? 'transaction' : 'transactions'
        } deleted successfully`,
      );
    } catch (error) {
      // Rollback on error
      setTransactions(previousTransactions);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete transactions: ${message}`);
      console.error('Bulk delete error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bulk update budget
   */
  const handleBulkUpdateBudget = async (
    ids: string[],
    budgetData: { id: number; label: string; category: string },
  ) => {
    setIsLoading(true);

    // Optimistic update
    const previousTransactions = [...transactions];
    setTransactions((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? {
              ...t,
              budgetId: budgetData.id,
              budgetLabel: budgetData.label,
              budgetCategory: budgetData.category,
              budgetType: undefined,
            }
          : t,
      ),
    );

    try {
      await spendingService.bulkUpdateTransactions(ids, {
        budgetId: budgetData.id,
      });
      toast.success(
        `Budget updated to "${budgetData.label}" for ${ids.length} ${
          ids.length === 1 ? 'transaction' : 'transactions'
        }`,
      );
    } catch (error) {
      // Rollback on error
      setTransactions(previousTransactions);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update budget: ${message}`);
      console.error('Bulk update budget error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bulk remove spread payment metadata.
   */
  const handleBulkRemoveSpread = async (ids: string[]) => {
    setIsLoading(true);

    // Optimistic update
    const previousTransactions = [...transactions];
    setTransactions((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? {
              ...t,
              isAccrual: false,
              spreadStartDate: null,
              spreadMonths: null,
            }
          : t,
      ),
    );

    try {
      await spendingService.bulkUpdateTransactions(ids, {
        isAccrual: false,
        spreadStartDate: null,
        spreadMonths: null,
      });
      toast.success(
        `Payment spread removed for ${ids.length} ${
          ids.length === 1 ? 'transaction' : 'transactions'
        }`,
      );
    } catch (error) {
      // Rollback on error
      setTransactions(previousTransactions);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update payment spread: ${message}`);
      console.error('Bulk remove spread error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bulk spread payments across each transaction's full calendar year.
   */
  const handleBulkSetFiscalYearSpread = async (ids: string[]) => {
    setIsLoading(true);

    const previousTransactions = [...transactions];
    const selectedTransactions = transactions.filter((transaction) =>
      ids.includes(transaction.id),
    );
    const spreadUpdatesById = new Map(
      selectedTransactions.map((transaction) => {
        const fiscalYearRange = getFiscalYearMonthRange(
          transaction.transactionDate,
        );

        return [
          transaction.id,
          {
            isAccrual: true,
            spreadStartDate: monthInputToIsoDate(fiscalYearRange.startMonth),
            spreadMonths: 12,
          },
        ] as const;
      }),
    );

    setTransactions((prev) =>
      prev.map((transaction) =>
        spreadUpdatesById.has(transaction.id)
          ? {
              ...transaction,
              ...spreadUpdatesById.get(transaction.id)!,
            }
          : transaction,
      ),
    );

    try {
      await spendingService.bulkUpdateTransactionsIndividually(
        selectedTransactions.map((transaction) => ({
          id: transaction.id,
          updates: spreadUpdatesById.get(transaction.id)!,
        })),
      );
      toast.success(
        `Payment spread set to full transaction year for ${
          selectedTransactions.length
        } ${
          selectedTransactions.length === 1 ? 'transaction' : 'transactions'
        }`,
      );
    } catch (error) {
      setTransactions(previousTransactions);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update payment spread: ${message}`);
      console.error('Bulk set fiscal year spread error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bulk update account
   */
  const handleBulkUpdateAccount = async (ids: string[], account: string) => {
    setIsLoading(true);

    // Optimistic update
    const previousTransactions = [...transactions];
    setTransactions((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, account } : t)),
    );

    try {
      await spendingService.bulkUpdateTransactions(ids, { account });
      toast.success(
        `Account updated for ${ids.length} ${
          ids.length === 1 ? 'transaction' : 'transactions'
        }`,
      );
    } catch (error) {
      // Rollback on error
      setTransactions(previousTransactions);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update account: ${message}`);
      console.error('Bulk update account error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleBulkDelete,
    handleBulkUpdateBudget,
    handleBulkUpdateAccount,
    handleBulkSetFiscalYearSpread,
    handleBulkRemoveSpread,
    isLoading,
  };
}
