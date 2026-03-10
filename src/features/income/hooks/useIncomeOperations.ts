/**
 * Hook for income CRUD operations
 * Handles add, delete, and other income entry operations with API integration
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { incomeApiService } from '../services/incomeApiService';
import type {
  IncomeEntry,
  Deductions,
  IncomeFrequency,
  EffectiveDateRange,
} from '../types/income';

interface UseIncomeOperationsReturn {
  isLoading: boolean;
  handleAddNewRow: () => void;
  handleDelete: (id: string) => Promise<void>;
  addEffectiveRange: (
    incomeId: string,
    range: Omit<EffectiveDateRange, 'id'>,
  ) => Promise<void>;
  deleteEffectiveRange: (incomeId: string, rangeId: string) => Promise<void>;
  updateEffectiveRange: (
    incomeId: string,
    rangeId: string,
    updates: Partial<EffectiveDateRange>,
  ) => Promise<void>;
  addNewIncome: (entry: {
    stream: string;
    type: string;
    frequency?: string;
    receivedDate?: string;
    // Effective range data
    grossAmount: number;
    netAmount: number;
    periods: number;
    deductions?: Deductions;
  }) => Promise<void>;
  renameStream: (oldName: string, newName: string) => Promise<void>;
  deleteStream: (streamName: string) => Promise<void>;
}

/**
 * Hook to manage income entry operations (add, delete) with API calls
 */
export function useIncomeOperations(
  incomeEntries: IncomeEntry[],
  setIncomeEntries: React.Dispatch<React.SetStateAction<IncomeEntry[]>>,
  onAddNewRow?: () => void,
): UseIncomeOperationsReturn {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddNewRow = useCallback(() => {
    onAddNewRow?.();
  }, [onAddNewRow]);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await incomeApiService.deleteIncome(id);
        setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));
        toast.success('Income deleted successfully');
      } catch (error) {
        console.error('Failed to delete income:', error);
        toast.error('Failed to delete income');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIncomeEntries],
  );

  const addEffectiveRange = useCallback(
    async (incomeId: string, range: Omit<EffectiveDateRange, 'id'>) => {
      setIsLoading(true);
      try {
        const updated = await incomeApiService.addEffectiveRange(
          incomeId,
          range,
        );
        setIncomeEntries((prev) =>
          prev.map((entry) => (entry.id === incomeId ? updated : entry)),
        );
        toast.success('Effective range added successfully');
      } catch (error) {
        console.error('Failed to add effective range:', error);
        toast.error('Failed to add effective range');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIncomeEntries],
  );

  const deleteEffectiveRange = useCallback(
    async (incomeId: string, rangeId: string) => {
      setIsLoading(true);
      try {
        const updated = await incomeApiService.deleteEffectiveRange(
          incomeId,
          rangeId,
        );
        setIncomeEntries((prev) =>
          prev.map((entry) => (entry.id === incomeId ? updated : entry)),
        );
        toast.success('Effective range deleted successfully');
      } catch (error) {
        console.error('Failed to delete effective range:', error);
        toast.error('Failed to delete effective range');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIncomeEntries],
  );

  const updateEffectiveRange = useCallback(
    async (
      incomeId: string,
      rangeId: string,
      updates: Partial<EffectiveDateRange>,
    ) => {
      setIsLoading(true);
      try {
        const updated = await incomeApiService.updateEffectiveRange(
          incomeId,
          rangeId,
          updates,
        );
        setIncomeEntries((prev) =>
          prev.map((entry) => (entry.id === incomeId ? updated : entry)),
        );
        toast.success('Effective range updated successfully');
      } catch (error) {
        console.error('Failed to update effective range:', error);
        toast.error('Failed to update effective range');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIncomeEntries],
  );

  const addNewIncome = useCallback(
    async (entry: {
      stream: string;
      type: string;
      frequency?: string;
      receivedDate?: string;
      grossAmount: number;
      netAmount: number;
      periods: number;
      deductions?: Deductions;
    }) => {
      setIsLoading(true);
      try {
        const newEntry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          stream: entry.stream,
          type: (entry.type as 'regular' | 'bonus') || 'regular',
          frequency:
            entry.type === 'bonus'
              ? ('one-time' as IncomeFrequency)
              : (entry.frequency as IncomeFrequency),
          receivedDate: entry.receivedDate,
          effectiveRanges: [
            {
              id: 'temp',
              startDate: new Date().toISOString().split('T')[0],
              endDate: null,
              grossAmount: entry.grossAmount,
              netAmount: entry.netAmount,
              periods: entry.periods,
              deductions: entry.deductions,
            },
          ],
        };

        const created = await incomeApiService.createIncome(newEntry);
        setIncomeEntries((prev) => [...prev, created]);
        toast.success(`Income "${created.stream}" added successfully`);
      } catch (error) {
        console.error('Failed to add income:', error);
        toast.error('Failed to add income');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIncomeEntries],
  );

  const renameStream = useCallback(
    async (oldStreamName: string, newStreamName: string) => {
      setIsLoading(true);
      try {
        // Find all entries with the old stream name
        const entriesToUpdate = incomeEntries.filter(
          (entry) => entry.stream === oldStreamName,
        );

        if (entriesToUpdate.length === 0) {
          throw new Error('No entries found with that stream name');
        }

        // Update each entry via API
        const updatePromises = entriesToUpdate.map((entry) =>
          incomeApiService.updateIncome(entry.id, { stream: newStreamName }),
        );

        await Promise.all(updatePromises);

        // Update local state
        setIncomeEntries((prev) =>
          prev.map((entry) =>
            entry.stream === oldStreamName
              ? { ...entry, stream: newStreamName }
              : entry,
          ),
        );

        toast.success(`Renamed "${oldStreamName}" to "${newStreamName}"`);
      } catch (error) {
        console.error('Failed to rename stream:', error);
        toast.error('Failed to rename stream');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [incomeEntries, setIncomeEntries],
  );

  const deleteStream = useCallback(
    async (streamName: string) => {
      setIsLoading(true);
      try {
        // Delete all entries with this stream name via API
        await incomeApiService.deleteIncomeStream(streamName);

        // Update local state - filter out all entries with this stream name
        setIncomeEntries((prev) =>
          prev.filter((entry) => entry.stream !== streamName),
        );

        toast.success(`Deleted income stream "${streamName}"`);
      } catch (error) {
        console.error('Failed to delete income stream:', error);
        toast.error('Failed to delete income stream');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [setIncomeEntries],
  );

  return {
    isLoading,
    handleAddNewRow,
    handleDelete,
    addEffectiveRange,
    deleteEffectiveRange,
    updateEffectiveRange,
    addNewIncome,
    renameStream,
    deleteStream,
  };
}
