import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LuPencil, LuPlus } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';

import { TAX_ADVANTAGED_BUCKET_DEFINITIONS } from '../constants/taxAdvantagedBuckets';
import type {
  AnnualAdjustment,
  TaxAdvantagedInvestments,
} from '../types/income';
import { getAnnualAdjustmentStatusLabel } from '../types/income';
import {
  OCCURRENCE_STATUS_BADGE_CLASSES,
  formatDate,
} from '../utils/incomeViewFormatters';

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
  if (value === 0) return formatRoundedCurrency(0);
  const prefix = value > 0 ? '+' : '-';
  return `${prefix}${formatRoundedCurrency(Math.abs(value))}`;
}

function getAmountToneClass(amount: number): string {
  if (amount > 0) return 'text-emerald-600';
  if (amount < 0) return 'text-danger';
  return 'text-app';
}

type OpenPopover = 'adj' | 'tax' | null;

function Popover({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute top-[calc(100%+8px)] right-0 z-50 w-[420px] rounded-xl border border-surface-border bg-white shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
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
  const [openPopover, setOpenPopover] = useState<OpenPopover>(null);
  const barRef = useRef<HTMLDivElement>(null);

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

  function togglePopover(id: OpenPopover, e: React.MouseEvent) {
    e.stopPropagation();
    setOpenPopover((prev) => (prev === id ? null : id));
  }

  useEffect(() => {
    function handleOutsideClick() {
      setOpenPopover(null);
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <section
      ref={barRef}
      className="surface-card overflow-visible p-0"
      aria-label="Income page footer summary"
    >
      <div className="grid md:grid-cols-2">

        {/* ── Annual Adjustments segment ── */}
        <div
          className="relative flex cursor-pointer items-center justify-between gap-5 rounded-l-xl px-6 py-4 transition-colors hover:bg-gray-50/60"
          onClick={(e) => togglePopover('adj', e)}
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
            onClick={(e) => togglePopover('adj', e)}
          >
            <LuPencil className="h-3.5 w-3.5" />
            Manage
          </Button>

          {openPopover === 'adj' && (
            <Popover>
              <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <span className="text-sm font-bold text-app">
                  Annual Adjustments
                </span>
                <button
                  className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-sm text-muted hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPopover(null);
                  }}
                >
                  ✕
                </button>
              </div>

              {adjustments.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted">No annual adjustments yet.</p>
                </div>
              ) : (
                <div>
                  {adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="flex items-center gap-3 border-b border-gray-50 px-4 py-2.5 last:border-b-0"
                    >
                      <span className="min-w-0 flex-1 text-sm font-medium text-app">
                        {adj.label}
                      </span>
                      <span className="min-w-[80px] text-xs text-muted">
                        {formatDate(adj.effectiveDate)}
                      </span>
                      <span
                        className={`min-w-[52px] rounded px-1.5 py-0.5 text-center text-[10.5px] font-semibold ${OCCURRENCE_STATUS_BADGE_CLASSES[adj.status]}`}
                      >
                        {getAnnualAdjustmentStatusLabel(adj.status)}
                      </span>
                      <span
                        className={`min-w-[76px] text-right text-sm font-semibold ${getAmountToneClass(adj.amount)}`}
                      >
                        {formatSignedRoundedCurrency(adj.amount)}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          className="rounded border border-surface-border px-2 py-0.5 text-xs text-muted hover:bg-gray-50 hover:text-app"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPopover(null);
                            onEditAdjustment(adj);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-red-100 px-2 py-0.5 text-xs text-red-400 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAdjustment(adj);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-surface-border px-4 py-2.5">
                <button
                  className="income-action-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPopover(null);
                    onAddAdjustment();
                  }}
                >
                  <LuPlus className="h-3 w-3" />
                  Add Adjustment
                </button>
              </div>
            </Popover>
          )}
        </div>

        {/* ── Tax-Advantaged Buckets segment ── */}
        <div
          className="relative flex cursor-pointer items-center justify-between gap-5 border-t px-6 py-4 transition-colors section-divider hover:bg-gray-50/60 md:rounded-r-xl md:border-t-0 md:border-l"
          onClick={(e) => togglePopover('tax', e)}
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
            onClick={(e) => togglePopover('tax', e)}
          >
            <LuPencil className="h-3.5 w-3.5" />
            Edit Buckets
          </Button>

          {openPopover === 'tax' && (
            <Popover>
              <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
                <span className="text-sm font-bold text-app">
                  Tax-Advantaged Contributions
                </span>
                <button
                  className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-sm text-muted hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPopover(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4">
                {TAX_ADVANTAGED_BUCKET_DEFINITIONS.map((def) => {
                  const entry = taxAdvantagedInvestments.entries.find(
                    (e) => e.bucketType === def.type,
                  );
                  return (
                    <div
                      key={def.type}
                      className="rounded-lg border border-surface-border bg-gray-50/60 p-3"
                    >
                      <p className="text-[10.5px] font-medium text-muted">
                        {def.label}
                      </p>
                      <p className="mt-0.5 text-[15px] font-bold text-app">
                        {formatRoundedCurrency(entry?.annualAmount ?? 0)}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        {def.behaviorLabel}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end border-t border-surface-border px-4 py-2.5">
                <Button
                  type="button"
                  variant="primary"
                  className="income-action-button-compact"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPopover(null);
                    onEditTaxAdvantagedInvestments();
                  }}
                >
                  <LuPencil className="h-3 w-3" />
                  Edit All Buckets
                </Button>
              </div>
            </Popover>
          )}
        </div>

      </div>
    </section>
  );
}
