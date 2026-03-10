import { useState } from 'react';
import { toast } from 'sonner';

import { budgetService } from '@/features/budget/services/budgetService';
import type { BudgetEntry } from '@/features/budget/types/budgetView';

export function useBudgetOperations(
  budgetEntries: BudgetEntry[],
  handlers: {
    upsertBudgetEntry: (entry: BudgetEntry) => void;
    removeBudgetEntry: (id: string) => void;
  },
) {
  const [isLoading, setIsLoading] = useState(false);
  const { upsertBudgetEntry, removeBudgetEntry } = handlers;

  /**
   * Create a new budget entry
   */
  const handleSave = async (
    itemData: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
  ) => {
    setIsLoading(true);
    try {
      const newEntry = await budgetService.createBudget(itemData);
      upsertBudgetEntry(newEntry);
      toast.success('Budget item created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create budget: ${message}`);
      console.error('Create budget error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing budget entry
   */
  const handleUpdate = async (
    id: string,
    updates: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
  ) => {
    setIsLoading(true);
    try {
      const updatedEntry = await budgetService.updateBudget(id, updates);
      upsertBudgetEntry(updatedEntry);
      toast.success('Budget item updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update budget: ${message}`);
      console.error('Update budget error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle accrual flag for a budget entry
   */
  const handleToggleAccrual = async (id: string) => {
    setIsLoading(true);
    try {
      const entry = budgetEntries.find((e) => e.id === id);
      if (!entry) throw new Error('Budget entry not found');

      const updatedEntry = await budgetService.updateBudget(id, {
        ...entry,
        isAccrual: !entry.isAccrual,
      });

      upsertBudgetEntry(updatedEntry);
      toast.success(
        updatedEntry.isAccrual
          ? 'Monthly reserve enabled for budget item'
          : 'Monthly reserve disabled for budget item',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update monthly reserve: ${message}`);
      console.error('Toggle accrual error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a budget entry
   */
  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      await budgetService.deleteBudget(id);
      removeBudgetEntry(id);
      toast.success('Budget item deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete budget: ${message}`);
      console.error('Delete budget error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSave,
    handleUpdate,
    handleToggleAccrual,
    handleDelete,
    isLoading,
  };
}
