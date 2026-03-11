import React from 'react';

import type { IncomeProjectionTotals } from '../types/income';

interface IncomeSummaryProps {
  year: number;
  onYearChange: (year: number) => void;
  totals: IncomeProjectionTotals;
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

function buildSummaryCards(totals: IncomeProjectionTotals): SummaryCard[] {
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
      label: 'Planned Deductions',
      primaryValue: formatCurrency(totals.plannedDeductions.total),
      secondaryValue: formatCurrency(totals.plannedNet),
      secondaryLabel: 'Net after deductions',
      hint: 'Taxes and withholdings in plan view',
    },
  ];
}

export const IncomeSummary: React.FC<IncomeSummaryProps> = ({
  year,
  onYearChange,
  totals,
}) => {
  const yearOptions = Array.from({ length: 5 }, (_, index) => year - 2 + index);
  const cards = buildSummaryCards(totals);

  return (
    <section className="space-y-4" aria-label="Income summary">
      <div className="surface-card flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Income Plan
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-app">
            Selected year projection
          </h2>
          <p className="mt-1 text-sm text-muted">
            Household totals are prorated across compensation changes and dated
            bonus payments.
          </p>
        </div>

        <label className="w-full max-w-[180px]">
          <span className="form-label">Planning year</span>
          <select
            className="form-input"
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="surface-card-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {card.label}
            </p>
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
