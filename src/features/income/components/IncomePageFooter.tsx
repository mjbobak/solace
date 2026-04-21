import React, { useMemo, useState } from 'react';
import { LuPencil } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';

import type {
  AnnualAdjustment,
  TaxAdvantagedInvestments,
} from '../types/income';
import { getAnnualAdjustmentStatusLabel } from '../types/income';
import { OCCURRENCE_STATUS_BADGE_CLASSES, formatDate } from '../utils/incomeViewFormatters';

interface IncomePageFooterProps {
  adjustments: AnnualAdjustment[];
  plannedAdjustmentTotal: number;
  taxAdvantagedInvestments: TaxAdvantagedInvestments;
  onAddAdjustment: () => void;
  onEditAdjustment: (adjustment: AnnualAdjustment) => void;
  onDeleteAdjustment: (adjustment: AnnualAdjustment) => void;
  onEditTaxAdvantagedInvestments: () => void;
}

function formatRoundedCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSignedRoundedCurrency(value: number): string {
  if (value === 0) {
    return formatRoundedCurrency(0);
  }

  const prefix = value > 0 ? '+' : '-';
  return `${prefix}${formatRoundedCurrency(Math.abs(value))}`;
}

function getAmountToneClass(amount: number): string {
  if (amount > 0) {
    return 'text-emerald-600';
  }

  if (amount < 0) {
    return 'text-danger';
  }

  return 'text-app';
}

export function IncomePageFooter({
  adjustments,
  plannedAdjustmentTotal,
  taxAdvantagedInvestments,
  onAddAdjustment,
  onEditAdjustment,
  onDeleteAdjustment,
  onEditTaxAdvantagedInvestments,
}: IncomePageFooterProps) {
  const [isManageAdjustmentsOpen, setIsManageAdjustmentsOpen] = useState(false);

  const employerBucketTotal = useMemo(
    () =>
      taxAdvantagedInvestments.entries.reduce(
        (sum, entry) =>
          entry.bucketType === '401k' || entry.bucketType === 'hsa'
            ? sum + entry.annualAmount
            : sum,
        0,
      ),
    [taxAdvantagedInvestments.entries],
  );
  const contributionSourceCount =
    Number(taxAdvantagedInvestments.spendableTotal > 0) +
    Number(employerBucketTotal > 0);

  return (
    <>
      <section
        className="surface-card overflow-hidden p-0"
        aria-label="Income page footer summary"
      >
        <div className="grid md:grid-cols-2">
          <div className="flex items-center justify-between gap-6 px-8 py-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Annual Adjustments
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={`text-xl font-semibold leading-none ${getAmountToneClass(
                    plannedAdjustmentTotal,
                  )}`}
                >
                  {formatSignedRoundedCurrency(plannedAdjustmentTotal)}
                </span>
                <span className="text-sm text-muted">
                  {adjustments.length} {adjustments.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="shrink-0 px-5 py-2.5 text-sm"
              onClick={() => setIsManageAdjustmentsOpen(true)}
            >
              <LuPencil className="h-4 w-4" />
              Manage
            </Button>
          </div>

          <div className="border-t section-divider md:border-t-0 md:border-l">
            <div className="flex items-center justify-between gap-6 px-8 py-5">
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Tax-Advantaged Buckets
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xl font-semibold leading-none text-app">
                    {formatRoundedCurrency(taxAdvantagedInvestments.total)}
                  </span>
                  <span className="text-sm text-muted">
                    {taxAdvantagedInvestments.entries.length} buckets ·{' '}
                    {contributionSourceCount}{' '}
                    {contributionSourceCount === 1 ? 'stream' : 'streams'}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-5 py-2.5 text-sm"
                onClick={onEditTaxAdvantagedInvestments}
              >
                <LuPencil className="h-4 w-4" />
                Edit Buckets
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Modal
        isOpen={isManageAdjustmentsOpen}
        onClose={() => setIsManageAdjustmentsOpen(false)}
        title="Manage Annual Adjustments"
        maxWidth="5xl"
        contentClassName="p-0"
      >
        <div className="flex items-center justify-between gap-4 border-b px-6 py-5 section-divider">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Annual Adjustments
            </p>
            <p className="mt-1 text-sm text-muted">
              Tax refunds, balances due, and other year-level reconciliations
              outside income streams.
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0"
            onClick={() => {
              setIsManageAdjustmentsOpen(false);
              onAddAdjustment();
            }}
          >
            Add Adjustment
          </Button>
        </div>

        {adjustments.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-lg font-semibold text-app">
              No annual adjustments yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Add tax refunds, balances due, or other annual reconciliations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="border-b section-divider bg-gray-50/60 text-left">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Adjustment
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Effective Date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adjustment) => (
                  <tr
                    key={adjustment.id}
                    className="border-b section-divider last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-app">
                        {adjustment.label}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-app">
                      {formatDate(adjustment.effectiveDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${OCCURRENCE_STATUS_BADGE_CLASSES[adjustment.status]}`}
                      >
                        {getAnnualAdjustmentStatusLabel(adjustment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold ${getAmountToneClass(
                          adjustment.amount,
                        )}`}
                      >
                        {formatSignedRoundedCurrency(adjustment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-3 py-1 text-xs"
                          onClick={() => {
                            setIsManageAdjustmentsOpen(false);
                            onEditAdjustment(adjustment);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="px-3 py-1 text-xs"
                          onClick={() => onDeleteAdjustment(adjustment)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
