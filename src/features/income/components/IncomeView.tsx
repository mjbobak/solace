import React, { useImperativeHandle } from 'react';

import { useIncomeActionMenu } from '../hooks/useIncomeActionMenu';
import { useIncomeViewController } from '../hooks/useIncomeViewController';
import { EMPTY_PROJECTION_TOTALS } from '../types/incomeView';

import { IncomeSourceActionMenu } from './IncomeSourceActionMenu';
import { IncomeSummary } from './IncomeSummary';
import { AddSourceModal } from './modals/AddSourceModal';
import { BonusOccurrenceModal } from './modals/BonusOccurrenceModal';
import { RecurringVersionModal } from './modals/RecurringVersionModal';
import { RenameSourceModal } from './modals/RenameSourceModal';
import { TaxAdvantagedInvestmentsModal } from './modals/TaxAdvantagedInvestmentsModal';
import { IncomeSourcesTable } from './table/IncomeSourcesTable';

export interface IncomeViewHandle {
  openAddIncomeModal: () => void;
}

interface IncomeViewProps {
  planningYear: number;
}

export const IncomeView = React.forwardRef<IncomeViewHandle, IncomeViewProps>(
  ({ planningYear }, ref) => {
  const {
    projection,
    isLoading,
    modalState,
    sources,
    expandedSources,
    versionModalState,
    bonusModalState,
    isTaxAdvantagedInvestmentsModalOpen,
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
  } = useIncomeViewController(planningYear);
  const {
    actionMenuPosition,
    actionMenuRef,
    openActionMenuSourceId,
    closeActionMenu,
    toggleActionMenu,
  } = useIncomeActionMenu();

  useImperativeHandle(ref, () => ({
    openAddIncomeModal,
  }));

  const activeActionMenuSource =
    sources.find((source) => source.id === openActionMenuSourceId) ?? null;

  return (
    <section className="space-y-6" aria-label="Income management">
      <IncomeSummary
        totals={projection?.totals ?? EMPTY_PROJECTION_TOTALS}
        taxAdvantagedInvestments={
          projection?.taxAdvantagedInvestments ?? {
            contributions401k: 0,
            total: 0,
          }
        }
        onEditTaxAdvantagedInvestments={openTaxAdvantagedInvestmentsModal}
      />

      <IncomeSourcesTable
        isLoading={isLoading}
        hasProjection={projection !== null}
        sources={sources}
        expandedSources={expandedSources}
        openActionMenuSourceId={openActionMenuSourceId}
        onOpenAddSource={openAddIncomeModal}
        onToggleSourceExpansion={toggleSourceExpansion}
        onToggleActionMenu={toggleActionMenu}
        onAddVersion={openAddVersionModal}
        onEditVersion={openEditVersionModal}
        onDeleteVersion={(component, version) => {
          void handleDeleteVersion(component, version);
        }}
        onMarkActual={(occurrence) => {
          void handleMarkBonusActual(occurrence);
        }}
        onEditBonus={openEditBonusModal}
        onDeleteBonus={(component, occurrence) => {
          void handleDeleteBonus(component, occurrence);
        }}
      />

      <AddSourceModal
        isOpen={modalState?.type === 'add-source'}
        onClose={closeModal}
        onSubmit={handleAddSource}
      />

      <RenameSourceModal
        isOpen={modalState?.type === 'rename-source'}
        source={modalState?.type === 'rename-source' ? modalState.source : null}
        onClose={closeModal}
        onSubmit={handleRenameSource}
      />

      <RecurringVersionModal
        isOpen={versionModalState !== null}
        component={versionModalState?.component ?? null}
        version={
          versionModalState?.type === 'edit-version'
            ? versionModalState.version
            : null
        }
        selectedYear={planningYear}
        onClose={closeModal}
        onSubmit={handleVersionModalSubmit}
      />

      <BonusOccurrenceModal
        isOpen={bonusModalState !== null}
        source={
          bonusModalState?.type === 'add-bonus' ? bonusModalState.source : null
        }
        component={
          bonusModalState?.type === 'edit-bonus'
            ? bonusModalState.component
            : null
        }
        occurrence={
          bonusModalState?.type === 'edit-bonus'
            ? bonusModalState.occurrence
            : null
        }
        onClose={closeModal}
        onSubmit={handleBonusModalSubmit}
      />

      <TaxAdvantagedInvestmentsModal
        isOpen={isTaxAdvantagedInvestmentsModalOpen}
        year={planningYear}
        initialContributions401k={
          projection?.taxAdvantagedInvestments.contributions401k ?? 0
        }
        onClose={closeModal}
        onSubmit={handleTaxAdvantagedInvestmentsSubmit}
      />

      <IncomeSourceActionMenu
        source={activeActionMenuSource}
        actionMenuPosition={actionMenuPosition}
        actionMenuRef={actionMenuRef}
        onRename={openRenameSourceModal}
        onAddBonus={openAddBonusModal}
        onDelete={(source) => {
          void handleDeleteSource(source);
        }}
        onClose={closeActionMenu}
      />
    </section>
  );
  },
);

IncomeView.displayName = 'IncomeView';
