/**
 * Main income view component
 * Orchestrates income display, editing, and management
 * ~100 lines - pure orchestration, no business logic
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import {
  getEnumParam,
  setStringParam,
} from '@/shared/utils/searchParams';

import { useIncomeCalculations } from '../hooks/useIncomeCalculations';
import { useIncomeFiltering } from '../hooks/useIncomeFiltering';
import { useIncomeGrouping } from '../hooks/useIncomeGrouping';
import { useIncomeOperations } from '../hooks/useIncomeOperations';
import { incomeApiService } from '../services/incomeApiService';
import type { EffectiveDateRange, IncomeEntry } from '../types/income';
import type {
  IncomePeriod,
  IncomeDisplayType,
  EffectiveDateRangeWithEntry,
  GroupedIncomeEntry,
} from '../types/incomeView';

import { AddIncomeModal } from './AddIncomeModal/index';
import { IncomeSummary } from './IncomeSummary';
import { IncomeTable } from './IncomeTable';
import { getIncomeTableColumns } from './incomeTableColumns';

/**
 * Calculate smart defaults for a new effective date range
 * - Start date: day after most recent range's end date (or today if ongoing)
 * - Amounts/frequency: copied from most recent range
 */
function calculateNewRangeDefaults(
  existingRanges: EffectiveDateRangeWithEntry[],
): Partial<EffectiveDateRange> {
  if (existingRanges.length === 0) {
    return {
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      grossAmount: 0,
      netAmount: 0,
      periods: 26,
    };
  }

  // Sort by start date descending (most recent first)
  const sorted = [...existingRanges].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  const mostRecentRange = sorted[0];

  // Calculate smart start date
  let startDate: string;
  if (mostRecentRange.endDate) {
    // Add 1 day to end date
    const nextDay = new Date(mostRecentRange.endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    startDate = nextDay.toISOString().split('T')[0];
  } else {
    // If ongoing, use today
    startDate = new Date().toISOString().split('T')[0];
  }

  return {
    startDate,
    endDate: null,
    grossAmount: mostRecentRange.grossAmount,
    netAmount: mostRecentRange.netAmount,
    periods: mostRecentRange.periods,
    deductions: mostRecentRange.deductions
      ? { ...mostRecentRange.deductions }
      : undefined,
  };
}

type ModalMode = 'add-stream' | 'add-range' | 'edit-range' | null;

interface ModalData {
  streamName?: string;
  existingEntry?: IncomeEntry;
  rangeToEdit?: EffectiveDateRange;
  initialData?: Partial<EffectiveDateRange>;
}

export interface IncomeViewHandle {
  openAddIncomeModal: () => void;
}

export const IncomeView = React.forwardRef<IncomeViewHandle>((_, ref) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const incomePeriod = getEnumParam<IncomePeriod>(
    searchParams,
    'period',
    ['monthly', 'annual'],
    'monthly',
  );
  const incomeType = getEnumParam<IncomeDisplayType>(
    searchParams,
    'type',
    ['net', 'gross'],
    'net',
  );
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [deletingStream, setDeletingStream] = useState<{
    name: string;
    count: number;
  } | null>(null);

  // Unified modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const updateQueryParams = React.useCallback(
    (updates: Partial<{ period: IncomePeriod; type: IncomeDisplayType }>) => {
      const nextSearchParams = new URLSearchParams(searchParams);

      if (updates.period) {
        setStringParam(nextSearchParams, 'period', updates.period);
      }

      if (updates.type) {
        setStringParam(nextSearchParams, 'type', updates.type);
      }

      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Fetch income data on mount
  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const data = await incomeApiService.getAllIncomes();
        setIncomeEntries(data);
      } catch (error) {
        console.error('Failed to fetch income data:', error);
        toast.error('Failed to load income data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchIncomeData();
  }, []);

  // Business logic hooks
  const { filteredData } = useIncomeFiltering(
    incomeEntries,
    incomePeriod,
    incomeType,
  );
  const { totals } = useIncomeCalculations(filteredData);
  const { groupedEntries, toggleExpansion } = useIncomeGrouping(
    incomeEntries,
    incomePeriod,
    incomeType,
  );
  const operations = useIncomeOperations(incomeEntries, setIncomeEntries, () =>
    setIsModalOpen(true),
  );

  // Extract unique stream names for duplicate validation
  const allStreamNames = useMemo(() => {
    return Array.from(new Set(incomeEntries.map((e) => e.stream)));
  }, [incomeEntries]);

  // Modal handlers
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalMode(null);
    setModalData(null);
  };

  const handleModalSave = async (data: unknown) => {
    try {
      if (modalMode === 'add-stream') {
        await operations.addNewIncome(
          data as Parameters<typeof operations.addNewIncome>[0],
        );
      } else if (modalMode === 'add-range' && modalData?.existingEntry) {
        await operations.addEffectiveRange(
          modalData.existingEntry.id,
          data as EffectiveDateRange,
        );
      } else if (modalMode === 'edit-range' && modalData?.existingEntry) {
        const rangeData = data as EffectiveDateRange;
        await operations.updateEffectiveRange(
          modalData.existingEntry.id,
          rangeData.id,
          rangeData,
        );
      }
      handleModalClose();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  // Button click handlers
  const handleAddIncomeClick = () => {
    setModalMode('add-stream');
    setIsModalOpen(true);
  };

  React.useImperativeHandle(
    ref,
    () => ({
      openAddIncomeModal: handleAddIncomeClick,
    }),
    [],
  );

  const handleAddRangeClick = (group: GroupedIncomeEntry) => {
    if (!group.activeEntry) return;

    const defaults = calculateNewRangeDefaults(group.allRanges);

    setModalMode('add-range');
    setModalData({
      streamName: group.streamName,
      existingEntry: group.activeEntry,
      initialData: defaults,
    });
    setIsModalOpen(true);
  };

  const handleEditRange = (range: EffectiveDateRangeWithEntry) => {
    const entry = incomeEntries.find((e) => e.id === range.entryId);
    if (!entry) return;

    setModalMode('edit-range');
    setModalData({
      streamName: entry.stream,
      existingEntry: entry,
      rangeToEdit: range,
    });
    setIsModalOpen(true);
  };

  const handleDeleteRange = async (range: EffectiveDateRangeWithEntry) => {
    try {
      await operations.deleteEffectiveRange(range.entryId, range.id);
    } catch (error) {
      console.error('Failed to delete range:', error);
    }
  };

  const handleDeleteStreamClick = (streamName: string, entryCount: number) => {
    setDeletingStream({ name: streamName, count: entryCount });
  };

  const handleDeleteStreamConfirm = async () => {
    if (deletingStream) {
      try {
        await operations.deleteStream(deletingStream.name);
        setDeletingStream(null);
      } catch (error) {
        console.error('Failed to delete stream:', error);
      }
    }
  };

  const handleDeleteStreamCancel = () => {
    setDeletingStream(null);
  };

  // Get table columns for parent and child rows
  const columns = getIncomeTableColumns({
    onDeleteRange: handleDeleteRange,
    onEditRange: handleEditRange,
    onToggleExpand: toggleExpansion,
    onRenameStream: operations.renameStream,
    allStreamNames,
    onDeleteStream: handleDeleteStreamClick,
    onAddRange: handleAddRangeClick,
  });

  const childColumns = getIncomeTableColumns({
    onDeleteRange: handleDeleteRange,
    onEditRange: handleEditRange,
    onToggleExpand: toggleExpansion,
    onRenameStream: operations.renameStream,
    allStreamNames,
    onDeleteStream: handleDeleteStreamClick,
    isChildRow: true,
    onAddRange: handleAddRangeClick,
  });

  if (isInitialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading income data...</p>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-label="Income management">
      {/* Summary and Cards Section */}
      <IncomeSummary
        period={incomePeriod}
        onPeriodChange={(period) => updateQueryParams({ period })}
        type={incomeType}
        onTypeChange={(type) => updateQueryParams({ type })}
        totals={totals}
      />

      {/* Table Section */}
      <div className="bg-white backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/40 p-6">
        {/* Table */}
        <IncomeTable
          data={groupedEntries}
          columns={columns}
          childColumns={childColumns}
          period={incomePeriod}
          displayType={incomeType}
          onAddRange={handleAddRangeClick}
        />
      </div>

      {/* Add Income Modal - Mode 1: Add Stream */}
      {modalMode === 'add-stream' && (
        <AddIncomeModal
          mode="add-stream"
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {/* Add Income Modal - Mode 2: Add Range */}
      {modalMode === 'add-range' && modalData && (
        <AddIncomeModal
          mode="add-range"
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          streamName={modalData.streamName || ''}
          existingEntry={modalData.existingEntry || ({} as IncomeEntry)}
          initialData={modalData.initialData}
        />
      )}

      {/* Add Income Modal - Mode 3: Edit Range */}
      {modalMode === 'edit-range' && modalData && (
        <AddIncomeModal
          mode="edit-range"
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          streamName={modalData.streamName || ''}
          existingEntry={modalData.existingEntry || ({} as IncomeEntry)}
          rangeToEdit={modalData.rangeToEdit || ({} as EffectiveDateRange)}
        />
      )}

      {/* Delete Stream Confirmation Dialog */}
      {deletingStream && (
        <ConfirmDialog
          isOpen={!!deletingStream}
          onClose={handleDeleteStreamCancel}
          onConfirm={handleDeleteStreamConfirm}
          title="Delete Income Stream"
          message={
            <>
              Are you sure you want to delete the income stream{' '}
              <strong>{deletingStream.name}</strong>?
              <br />
              <br />
              This will permanently delete{' '}
              <strong>
                {deletingStream.count}{' '}
                {deletingStream.count === 1 ? 'entry' : 'entries'}
              </strong>
              . This action cannot be undone.
            </>
          }
          confirmText="Delete Stream"
          variant="danger"
          isLoading={operations.isLoading}
        />
      )}
    </section>
  );
});

IncomeView.displayName = 'IncomeView';
