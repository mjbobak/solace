import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { usePlanningYearSelection } from '@/shared/hooks/usePlanningYearSelection';

import { incomeApiService } from '../services/incomeApiService';
import type {
  CreateRecurringIncomeVersionInput,
  IncomeOccurrence,
  IncomeYearProjection,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
} from '../types/income';
import { getComponentDisplayName } from '../types/income';
import type {
  AddBonusModalSubmit,
  AddSourceModalSubmit,
  EditBonusModalSubmit,
  IncomeViewModalState,
} from '../types/incomeView';
import {
  isAddBonusModalSubmit,
  isEditBonusModalSubmit,
} from '../types/incomeView';
import { formatDate } from '../utils/incomeViewFormatters';

interface UseIncomeViewControllerResult {
  planningYears: number[];
  selectedYear: number;
  projection: IncomeYearProjection | null;
  isLoading: boolean;
  modalState: IncomeViewModalState | null;
  sources: ProjectedIncomeSource[];
  expandedSources: Set<number>;
  versionModalState: Extract<
    IncomeViewModalState,
    { type: 'add-version' } | { type: 'edit-version' }
  > | null;
  bonusModalState: Extract<
    IncomeViewModalState,
    { type: 'add-bonus' } | { type: 'edit-bonus' }
  > | null;
  isTaxAdvantagedInvestmentsModalOpen: boolean;
  setSelectedYear: (year: number) => void;
  openAddIncomeModal: () => void;
  openTaxAdvantagedInvestmentsModal: () => void;
  closeModal: () => void;
  toggleSourceExpansion: (sourceId: number) => void;
  openRenameSourceModal: (source: ProjectedIncomeSource) => void;
  openAddVersionModal: (component: ProjectedIncomeComponent) => void;
  openEditVersionModal: (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => void;
  openAddBonusModal: (source: ProjectedIncomeSource) => void;
  openEditBonusModal: (
    component: ProjectedIncomeComponent,
    occurrence: IncomeOccurrence,
  ) => void;
  handleAddSource: (payload: AddSourceModalSubmit) => Promise<void>;
  handleRenameSource: (sourceId: number, name: string) => Promise<void>;
  handleVersionModalSubmit: (
    targetId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => Promise<void>;
  handleBonusModalSubmit: (
    targetId: number,
    payload: AddBonusModalSubmit | EditBonusModalSubmit,
  ) => Promise<void>;
  handleMarkBonusActual: (occurrence: IncomeOccurrence) => Promise<void>;
  handleDeleteVersion: (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => Promise<void>;
  handleDeleteBonus: (
    component: ProjectedIncomeComponent,
    occurrence: IncomeOccurrence,
  ) => Promise<void>;
  handleDeleteSource: (source: ProjectedIncomeSource) => Promise<void>;
  handleTaxAdvantagedInvestmentsSubmit: (input: {
    contributions401k: number;
  }) => Promise<void>;
}

export function useIncomeViewController(): UseIncomeViewControllerResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projection, setProjection] = useState<IncomeYearProjection | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState<IncomeViewModalState | null>(
    null,
  );
  const [expandedSources, setExpandedSources] = useState<Set<number>>(
    () => new Set(),
  );
  const [
    isTaxAdvantagedInvestmentsModalOpen,
    setIsTaxAdvantagedInvestmentsModalOpen,
  ] = useState(false);
  const currentYear = new Date().getFullYear();
  const {
    availableYears: planningYears,
    selectedYear,
    setSelectedYear,
  } = usePlanningYearSelection({
    searchParams,
    setSearchParams,
    fallbackYear: currentYear,
  });

  const loadProjection = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await incomeApiService.getYearProjection(selectedYear);
      setProjection(response);
    } catch (error) {
      console.error('Failed to load income projection:', error);
      toast.error('Failed to load income data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void loadProjection();
  }, [loadProjection]);

  const closeModal = () => {
    setModalState(null);
    setIsTaxAdvantagedInvestmentsModalOpen(false);
  };

  const openAddIncomeModal = () => {
    setModalState({ type: 'add-source' });
  };

  const openTaxAdvantagedInvestmentsModal = () => {
    setIsTaxAdvantagedInvestmentsModalOpen(true);
  };

  const openRenameSourceModal = (source: ProjectedIncomeSource) => {
    setModalState({ type: 'rename-source', source });
  };

  const openAddVersionModal = (component: ProjectedIncomeComponent) => {
    setModalState({ type: 'add-version', component });
  };

  const openEditVersionModal = (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => {
    setModalState({ type: 'edit-version', component, version });
  };

  const openAddBonusModal = (source: ProjectedIncomeSource) => {
    setModalState({ type: 'add-bonus', source });
  };

  const openEditBonusModal = (
    component: ProjectedIncomeComponent,
    occurrence: IncomeOccurrence,
  ) => {
    setModalState({ type: 'edit-bonus', component, occurrence });
  };

  const versionModalState = useMemo(
    () =>
      modalState?.type === 'add-version' || modalState?.type === 'edit-version'
        ? modalState
        : null,
    [modalState],
  );

  const bonusModalState = useMemo(
    () =>
      modalState?.type === 'add-bonus' || modalState?.type === 'edit-bonus'
        ? modalState
        : null,
    [modalState],
  );

  const handleAddSource = async (payload: AddSourceModalSubmit) => {
    try {
      const source = await incomeApiService.createSource({
        name: payload.sourceName,
      });
      const component = await incomeApiService.createComponent(source.id, {
        componentType: 'base_pay',
        componentMode: 'recurring',
        label: 'Base pay',
      });
      await incomeApiService.createRecurringVersion(component.id, {
        startDate: payload.startDate,
        grossAmount: payload.grossAmount,
        netAmount: payload.netAmount,
        periodsPerYear: payload.periodsPerYear,
      });

      toast.success('Income source added');
      closeModal();
      await loadProjection();
    } catch (error) {
      console.error('Failed to create income source:', error);
      toast.error('Failed to create income source');
      throw error;
    }
  };

  const handleAddVersion = async (
    componentId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => {
    try {
      await incomeApiService.createRecurringVersion(componentId, input);
      toast.success('Compensation change saved');
      closeModal();
      await loadProjection();
    } catch (error) {
      console.error('Failed to create recurring version:', error);
      toast.error('Failed to save compensation change');
      throw error;
    }
  };

  const handleUpdateVersion = async (
    versionId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => {
    try {
      await incomeApiService.updateRecurringVersion(versionId, input);
      toast.success('Compensation change updated');
      closeModal();
      await loadProjection();
    } catch (error) {
      console.error('Failed to update recurring version:', error);
      toast.error('Failed to update compensation change');
      throw error;
    }
  };

  const handleRenameSource = async (sourceId: number, name: string) => {
    try {
      await incomeApiService.updateSource(sourceId, { name });
      toast.success('Income source renamed');
      closeModal();
      await loadProjection();
    } catch (error) {
      console.error('Failed to rename income source:', error);
      toast.error('Failed to rename income source');
      throw error;
    }
  };

  const handleAddBonus = async (
    sourceId: number,
    payload: AddBonusModalSubmit,
  ) => {
    try {
      let componentId = payload.existingBonusComponentId;
      if (!componentId) {
        const component = await incomeApiService.createComponent(sourceId, {
          componentType: 'bonus',
          componentMode: 'occurrence',
          label: payload.label || 'Bonus',
        });
        componentId = component.id;
      }

      await incomeApiService.createOccurrence(componentId, payload.occurrence);
      toast.success('Bonus saved');
      closeModal();
      await loadProjection();
    } catch (error) {
      console.error('Failed to create bonus occurrence:', error);
      toast.error('Failed to save bonus');
      throw error;
    }
  };

  const handleUpdateBonus = async (
    occurrenceId: number,
    input: EditBonusModalSubmit,
  ) => {
    try {
      await incomeApiService.updateComponent(input.componentId, {
        label: input.label || 'Bonus',
      });
      await incomeApiService.updateOccurrence(occurrenceId, input.occurrence);
      toast.success('Bonus updated');
      closeModal();
      await loadProjection();
    } catch (error) {
      console.error('Failed to update bonus occurrence:', error);
      toast.error('Failed to update bonus');
      throw error;
    }
  };

  const handleMarkBonusActual = async (occurrence: IncomeOccurrence) => {
    try {
      await incomeApiService.updateOccurrence(occurrence.id, {
        status: 'actual',
        paidDate: occurrence.paidDate ?? occurrence.plannedDate,
      });
      toast.success('Bonus marked as actual');
      await loadProjection();
    } catch (error) {
      console.error('Failed to mark bonus as actual:', error);
      toast.error('Failed to update bonus');
    }
  };

  const handleDeleteVersion = async (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => {
    const label = getComponentDisplayName(component);
    if (
      !window.confirm(
        `Delete the ${label} compensation change from ${formatDate(version.startDate)} to ${formatDate(version.endDate)}?`,
      )
    ) {
      return;
    }

    try {
      await incomeApiService.deleteRecurringVersion(version.id);
      toast.success('Compensation change deleted');
      await loadProjection();
    } catch (error) {
      console.error('Failed to delete recurring version:', error);
      toast.error('Failed to delete compensation change');
    }
  };

  const handleDeleteBonus = async (
    component: ProjectedIncomeComponent,
    occurrence: IncomeOccurrence,
  ) => {
    const label = getComponentDisplayName(component);
    if (
      !window.confirm(
        `Delete the ${label} event scheduled for ${formatDate(occurrence.paidDate ?? occurrence.plannedDate)}?`,
      )
    ) {
      return;
    }

    try {
      await incomeApiService.deleteOccurrence(occurrence.id);
      toast.success('Bonus deleted');
      await loadProjection();
    } catch (error) {
      console.error('Failed to delete bonus occurrence:', error);
      toast.error('Failed to delete bonus');
    }
  };

  const handleDeleteSource = async (source: ProjectedIncomeSource) => {
    if (!window.confirm(`Delete income source "${source.name}"?`)) {
      return;
    }

    try {
      await incomeApiService.deleteSource(source.id);
      toast.success('Income source deleted');
      await loadProjection();
    } catch (error) {
      console.error('Failed to delete income source:', error);
      toast.error('Failed to delete income source');
    }
  };

  const handleTaxAdvantagedInvestmentsSubmit = async (input: {
    contributions401k: number;
  }) => {
    try {
      await incomeApiService.updateYearSettings(selectedYear, input);
      toast.success('Tax advantaged investments saved');
      closeModal();
      await loadProjection();
    } catch (error) {
      console.error('Failed to save tax advantaged investments:', error);
      toast.error('Failed to save tax advantaged investments');
      throw error;
    }
  };

  const handleVersionModalSubmit = async (
    targetId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => {
    if (versionModalState?.type === 'edit-version') {
      await handleUpdateVersion(targetId, input);
      return;
    }

    await handleAddVersion(targetId, input);
  };

  const handleBonusModalSubmit = async (
    targetId: number,
    payload: AddBonusModalSubmit | EditBonusModalSubmit,
  ) => {
    if (bonusModalState?.type === 'edit-bonus') {
      if (isEditBonusModalSubmit(payload)) {
        await handleUpdateBonus(targetId, payload);
      }
      return;
    }

    if (isAddBonusModalSubmit(payload)) {
      await handleAddBonus(targetId, payload);
    }
  };

  const toggleSourceExpansion = (sourceId: number) => {
    setExpandedSources((previous) => {
      const next = new Set(previous);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  return {
    planningYears,
    selectedYear,
    projection,
    isLoading,
    modalState,
    sources: projection?.sources ?? [],
    expandedSources,
    versionModalState,
    bonusModalState,
    isTaxAdvantagedInvestmentsModalOpen,
    setSelectedYear,
    openAddIncomeModal,
    openTaxAdvantagedInvestmentsModal,
    closeModal,
    toggleSourceExpansion,
    openRenameSourceModal,
    openAddVersionModal,
    openEditVersionModal,
    openAddBonusModal,
    openEditBonusModal,
    handleAddSource,
    handleRenameSource,
    handleVersionModalSubmit,
    handleBonusModalSubmit,
    handleMarkBonusActual,
    handleDeleteVersion,
    handleDeleteBonus,
    handleDeleteSource,
    handleTaxAdvantagedInvestmentsSubmit,
  };
}
