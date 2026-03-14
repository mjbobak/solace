import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';

import { TAX_ADVANTAGED_BUCKET_DEFINITIONS } from '../constants/taxAdvantagedBuckets';
import type { TaxAdvantagedInvestments } from '../types/income';

interface TaxAdvantagedBucketsSectionProps {
  taxAdvantagedInvestments: TaxAdvantagedInvestments;
  onEdit: () => void;
}

export function TaxAdvantagedBucketsSection({
  taxAdvantagedInvestments,
  onEdit,
}: TaxAdvantagedBucketsSectionProps) {
  const entryMap = new Map(
    taxAdvantagedInvestments.entries.map((entry) => [
      entry.bucketType,
      entry.annualAmount,
    ]),
  );

  return (
    <section className="surface-card space-y-4" aria-label="Tax-advantaged buckets">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Tax-Advantaged Buckets
          </p>
          <h3 className="mt-2 text-xl font-semibold text-app">
            Household payroll-style benefits
          </h3>
          <p className="mt-1 text-sm text-muted">
            Annual household buckets sit outside income streams so recurring pay
            and bonuses stay source-specific.
          </p>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          Edit Buckets
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TAX_ADVANTAGED_BUCKET_DEFINITIONS.map((bucket) => (
          <article key={bucket.type} className="surface-card-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {bucket.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-app">
              {formatCurrency(entryMap.get(bucket.type) ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted">{bucket.behaviorLabel}</p>
            <p className="mt-1 text-sm text-muted">{bucket.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
