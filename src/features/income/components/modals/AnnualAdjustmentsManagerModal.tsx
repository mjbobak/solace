import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';

import type { AnnualAdjustment } from '../../types/income';
import { getAnnualAdjustmentStatusLabel } from '../../types/income';
import {
  OCCURRENCE_STATUS_BADGE_CLASSES,
  formatDate,
  formatWholeCurrency,
} from '../../utils/incomeViewFormatters';

interface AnnualAdjustmentsManagerModalProps {
  isOpen: boolean;
  adjustments: AnnualAdjustment[];
  plannedAdjustmentTotal: number;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (adjustment: AnnualAdjustment) => void;
  onDelete: (adjustment: AnnualAdjustment) => void;
}

function formatSignedCurrency(amount: number): string {
  if (amount === 0) {
    return formatWholeCurrency(0);
  }

  const prefix = amount > 0 ? '+' : '-';
  return `${prefix}${formatWholeCurrency(Math.abs(amount))}`;
}

function getAmountToneClass(amount: number): string {
  if (amount > 0) {
    return 'text-emerald-600 dark:text-emerald-400';
  }

  if (amount < 0) {
    return 'text-danger';
  }

  return 'text-app';
}

export function AnnualAdjustmentsManagerModal({
  isOpen,
  adjustments,
  plannedAdjustmentTotal,
  onClose,
  onAdd,
  onEdit,
  onDelete,
}: AnnualAdjustmentsManagerModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Annual Adjustments"
      maxWidth="4xl"
      contentClassName="space-y-5"
    >
      <div className="surface-subtle flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Annual Adjustments
          </p>
          <p className="mt-2 text-sm text-muted">
            Year-level cash true-ups like refunds, balances due, and other
            non-payroll adjustments.
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Planned impact
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${getAmountToneClass(plannedAdjustmentTotal)}`}
          >
            {formatSignedCurrency(plannedAdjustmentTotal)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {adjustments.length === 0
            ? 'No annual adjustments yet.'
            : `${adjustments.length} ${adjustments.length === 1 ? 'adjustment' : 'adjustments'} for this planning year.`}
        </p>
        <Button onClick={onAdd}>
          <LuPlus className="h-4 w-4" />
          Add Adjustment
        </Button>
      </div>

      {adjustments.length === 0 ? (
        <div className="surface-subtle rounded-2xl border border-dashed p-10 text-center text-sm text-muted">
          Add your first adjustment to capture refunds, tax bills, or one-off
          year-end reconciliations.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border section-divider">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="surface-subtle-header text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Adjustment
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Effective Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adjustment) => (
                  <tr
                    key={adjustment.id}
                    className="border-b section-divider align-top last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-app">
                        {adjustment.label}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-app">
                      {formatDate(adjustment.effectiveDate)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${OCCURRENCE_STATUS_BADGE_CLASSES[adjustment.status]}`}
                      >
                        {getAnnualAdjustmentStatusLabel(adjustment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-sm font-semibold ${getAmountToneClass(
                          adjustment.amount,
                        )}`}
                      >
                        {formatSignedCurrency(adjustment.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="table-action-button table-action-button-edit"
                          onClick={() => onEdit(adjustment)}
                          title={`Edit annual adjustment ${adjustment.label}`}
                          aria-label={`Edit annual adjustment ${adjustment.label}`}
                        >
                          <LuPencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="table-action-button table-action-button-delete"
                          onClick={() => onDelete(adjustment)}
                          title={`Delete annual adjustment ${adjustment.label}`}
                          aria-label={`Delete annual adjustment ${adjustment.label}`}
                        >
                          <LuTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
