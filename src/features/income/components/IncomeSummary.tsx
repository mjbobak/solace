import React from 'react';

import { Button } from '@/shared/components/Button';

import type {
  IncomeProjectionTotals,
  TaxAdvantagedInvestments,
} from '../types/income';

interface IncomeSummaryProps {
  totals: IncomeProjectionTotals;
  taxAdvantagedInvestments: TaxAdvantagedInvestments;
  onEditTaxAdvantagedInvestments: () => void;
}

interface AmountStackProps {
  primaryValue: string;
  secondaryValue: string;
  secondaryLabel?: string;
}

interface SummaryCard {
  label: string;
  primaryValue: string;
  secondaryValue: string;
  secondaryLabel?: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function AmountStack({
  primaryValue,
  secondaryValue,
  secondaryLabel = 'Net',
}: AmountStackProps) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-2xl font-semibold text-black">{primaryValue}</span>
      <span className="mt-1 text-sm text-gray-500">
        {secondaryValue} {secondaryLabel}
      </span>
    </div>
  );
}

function buildSummaryCards(
  totals: IncomeProjectionTotals,
  taxAdvantagedInvestments: TaxAdvantagedInvestments,
  onEditTaxAdvantagedInvestments: () => void,
): SummaryCard[] {
  const expectedGrossDelta = totals.plannedGross - totals.committedGross;
  const expectedNetDelta = totals.plannedNet - totals.committedNet;

  return [
    {
      label: 'Committed Income',
      primaryValue: formatCurrency(totals.committedGross),
      secondaryValue: formatCurrency(totals.committedNet),
      hint: 'Recurring income plus actual bonuses',
    },
    {
      label: 'Planned Income',
      primaryValue: formatCurrency(totals.plannedGross),
      secondaryValue: formatCurrency(totals.plannedNet),
      hint: 'Includes expected bonuses',
    },
    {
      label: 'Expected Upside',
      primaryValue: formatCurrency(expectedGrossDelta),
      secondaryValue: formatCurrency(expectedNetDelta),
      hint: 'Planned minus committed',
    },
    {
      label: 'Tax-Advantaged Buckets',
      primaryValue: formatCurrency(taxAdvantagedInvestments.total),
      secondaryValue: formatCurrency(taxAdvantagedInvestments.spendableTotal),
      secondaryLabel: 'Spendable Restricted',
      hint: 'Annual household payroll buckets tracked outside income streams',
      actionLabel: 'Edit',
      onAction: onEditTaxAdvantagedInvestments,
    },
  ];
}

export const IncomeSummary: React.FC<IncomeSummaryProps> = ({
  totals,
  taxAdvantagedInvestments,
  onEditTaxAdvantagedInvestments,
}) => {
  const cards = buildSummaryCards(
    totals,
    taxAdvantagedInvestments,
    onEditTaxAdvantagedInvestments,
  );

  return (
    <section className="space-y-4" aria-label="Income summary">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="surface-card-soft">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                {card.label}
              </p>
              {card.actionLabel && card.onAction ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1 text-xs"
                  onClick={card.onAction}
                >
                  {card.actionLabel}
                </Button>
              ) : null}
            </div>
            <div className="mt-3">
              <AmountStack
                primaryValue={card.primaryValue}
                secondaryValue={card.secondaryValue}
                secondaryLabel={card.secondaryLabel}
              />
            </div>
            <p className="mt-2 text-sm text-muted">{card.hint}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
