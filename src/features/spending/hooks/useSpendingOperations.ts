import { useState } from 'react';
import { toast } from 'sonner';

import { spendingService } from '@/features/spending/services/spendingService';
import type { SpendingEntry } from '@/features/spending/types/spendingView';

export function useSpendingOperations(
  transactions: SpendingEntry[],
  setTransactions: React.Dispatch<React.SetStateAction<SpendingEntry[]>>,
) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Create a new transaction
   */
  const handleCreate = async (
    entry: Omit<SpendingEntry, 'id'>,
  ): Promise<SpendingEntry | null> => {
    setIsLoading(true);
    try {
      const newTransaction = await spendingService.createTransaction(entry);
      setTransactions((prev) => [newTransaction, ...prev]);
      toast.success('Transaction created successfully');
      return newTransaction;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create transaction: ${message}`);
      console.error('Create transaction error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing transaction
   */
  const handleUpdate = async (
    id: string,
    updates: Partial<SpendingEntry>,
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const updatedTransaction = await spendingService.updateTransaction(
        id,
        updates,
      );
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updatedTransaction : t)),
      );
      toast.success('Transaction updated successfully');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update transaction: ${message}`);
      console.error('Update transaction error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle accrual flag for a transaction
   */
  const handleToggleAccrual = async (id: string) => {
    setIsLoading(true);
    try {
      const transaction = transactions.find((t) => t.id === id);
      if (!transaction) throw new Error('Transaction not found');

      const updatedTransaction = await spendingService.updateTransaction(id, {
        isAccrual: !transaction.isAccrual,
      });

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? updatedTransaction : t)),
      );
      toast.success(
        !transaction.isAccrual
          ? 'Payment spread enabled for transaction'
          : 'Payment spread disabled for transaction',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update payment spread: ${message}`);
      console.error('Toggle accrual error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a transaction
   */
  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await spendingService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success('Transaction deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete transaction: ${message}`);
      console.error('Delete transaction error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleCreate,
    handleUpdate,
    handleToggleAccrual,
    handleDelete,
    isLoading,
  };
}
