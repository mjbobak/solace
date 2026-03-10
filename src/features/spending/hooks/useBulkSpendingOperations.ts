import { useState } from 'react';
import { toast } from 'sonner';

import { spendingService } from '@/features/spending/services/spendingService';
import type { SpendingEntry } from '@/features/spending/types/spendingView';

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
    handleBulkRemoveSpread,
    isLoading,
  };
}
