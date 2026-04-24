import React, { useMemo } from 'react';
import { LuPencil } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';

import type {
  AnnualAdjustment,
  TaxAdvantagedInvestments,
} from '../types/income';

interface IncomePageFooterProps {
  adjustments: AnnualAdjustment[];
  plannedAdjustmentTotal: number;
  taxAdvantagedInvestments: TaxAdvantagedInvestments;
  onManageAdjustments: () => void;
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
  if (value === 0) return formatRoundedCurrency(0);
  const prefix = value > 0 ? '+' : '-';
  return `${prefix}${formatRoundedCurrency(Math.abs(value))}`;
}

function getAmountToneClass(amount: number): string {
  if (amount > 0) return 'text-emerald-600';
  if (amount < 0) return 'text-danger';
  return 'text-app';
}

export function IncomePageFooter({
  adjustments,
  plannedAdjustmentTotal,
  taxAdvantagedInvestments,
  onManageAdjustments,
  onEditTaxAdvantagedInvestments,
}: IncomePageFooterProps) {
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

  const activateOnKeyDown =
    (handler: () => void) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler();
      }
    };

  return (
    <section className="surface-card overflow-visible p-0" aria-label="Income page footer summary">
      <div className="grid md:grid-cols-2">
        <div
          className="surface-hover-subtle relative flex cursor-pointer items-center justify-between gap-5 rounded-l-xl px-6 py-4"
          onClick={onManageAdjustments}
          onKeyDown={activateOnKeyDown(onManageAdjustments)}
          role="button"
          tabIndex={0}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Annual Adjustments
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`text-base font-semibold leading-none ${getAmountToneClass(plannedAdjustmentTotal)}`}
              >
                {formatSignedRoundedCurrency(plannedAdjustmentTotal)}
              </span>
              <span className="text-xs text-muted">
                {adjustments.length}{' '}
                {adjustments.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            className="button-primary-small shrink-0"
            onClick={(event) => {
              event.stopPropagation();
              onManageAdjustments();
            }}
          >
            <LuPencil className="h-3.5 w-3.5" />
            Manage
          </Button>
        </div>

        <div
          className="surface-hover-subtle relative flex cursor-pointer items-center justify-between gap-5 border-t px-6 py-4 section-divider md:rounded-r-xl md:border-t-0 md:border-l"
          onClick={onEditTaxAdvantagedInvestments}
          onKeyDown={activateOnKeyDown(onEditTaxAdvantagedInvestments)}
          role="button"
          tabIndex={0}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Tax-Advantaged Buckets
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-base font-semibold leading-none text-app">
                {formatRoundedCurrency(taxAdvantagedInvestments.total)}
              </span>
              <span className="text-xs text-muted">
                {taxAdvantagedInvestments.entries.length} buckets ·{' '}
                {contributionSourceCount}{' '}
                {contributionSourceCount === 1 ? 'stream' : 'streams'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            className="button-primary-small shrink-0"
            onClick={(event) => {
              event.stopPropagation();
              onEditTaxAdvantagedInvestments();
            }}
          >
            <LuPencil className="h-3.5 w-3.5" />
            Edit Buckets
          </Button>
        </div>
      </div>
    </section>
  );
}
