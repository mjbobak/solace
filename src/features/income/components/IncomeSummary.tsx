import React from 'react';

import type {
  IncomeProjectionTotals,
  ProjectedIncomeSource,
  TaxAdvantagedInvestments,
} from '../types/income';

import { IncomeOverviewCard } from './IncomeOverviewCard';

interface IncomeSummaryProps {
  totals: IncomeProjectionTotals;
  sources: ProjectedIncomeSource[];
  taxAdvantagedInvestments: TaxAdvantagedInvestments;
}

function formatRoundedCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

interface TaxDetailProps {
  label: string;
  value: string;
  className?: string;
}

function TaxDetail({ label, value, className = '' }: TaxDetailProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="text-xs font-semibold leading-none text-app">{value}</p>
    </div>
  );
}

export const IncomeSummary: React.FC<IncomeSummaryProps> = ({
  totals,
  sources,
  taxAdvantagedInvestments,
}) => {
  const employerBucketTotal = taxAdvantagedInvestments.entries.reduce(
    (sum, entry) =>
      entry.bucketType === '401k' || entry.bucketType === 'hsa'
        ? sum + entry.annualAmount
        : sum,
    0,
  );
  const restrictedBucketTotal = taxAdvantagedInvestments.spendableTotal;
  const contributionSourceCount =
    Number(restrictedBucketTotal > 0) + Number(employerBucketTotal > 0);

  return (
    <section aria-label="Income summary">
      <div className="grid gap-5 xl:grid-cols-2">
        <IncomeOverviewCard totals={totals} sources={sources} />

        <article className="surface-card h-full p-4 text-left md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Tax-Advantaged Buckets
          </p>
          <div className="mt-2.5 flex flex-col gap-1 md:flex-row md:items-end md:gap-2">
            <span className="text-xl font-semibold leading-tight text-app md:text-2xl">
              {formatRoundedCurrency(taxAdvantagedInvestments.total)}
            </span>
            <span className="text-xs font-medium text-muted">
              annual contributions
            </span>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3 md:gap-0">
            <TaxDetail
              label="Spendable Restricted"
              value={formatRoundedCurrency(restrictedBucketTotal)}
            />
            <TaxDetail
              label="Employer 401k + HSA"
              value={formatRoundedCurrency(employerBucketTotal)}
              className="border-t pt-3 section-divider md:border-t-0 md:border-l md:px-5 md:pt-0"
            />
            <TaxDetail
              label="Sources"
              value={`${contributionSourceCount} ${
                contributionSourceCount === 1 ? 'stream' : 'streams'
              }`}
              className="border-t pt-3 section-divider md:border-t-0 md:border-l md:pl-5 md:pt-0"
            />
          </div>
        </article>
      </div>
    </section>
  );
};
