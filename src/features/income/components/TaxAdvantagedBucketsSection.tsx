import { useId, useState } from 'react';
import { LuChevronDown, LuChevronRight } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';
import { formatWholeCurrency } from '../utils/incomeViewFormatters';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const entryMap = new Map(
    taxAdvantagedInvestments.entries.map((entry) => [
      entry.bucketType,
      entry.annualAmount,
    ]),
  );

  return (
    <section
      className="surface-card overflow-hidden p-0"
      aria-label="Tax-advantaged buckets"
    >
      <div className="border-b section-divider bg-gray-50/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Tax-Advantaged Buckets
        </p>
      </div>

      <div className="px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="icon-button mt-0.5 rounded-full border border-app p-2"
              onClick={() => setIsExpanded((previous) => !previous)}
              aria-expanded={isExpanded}
              aria-controls={contentId}
              aria-label={
                isExpanded
                  ? 'Hide tax-advantaged bucket details'
                  : 'Show tax-advantaged bucket details'
              }
              title={
                isExpanded
                  ? 'Hide tax-advantaged bucket details'
                  : 'Show tax-advantaged bucket details'
              }
            >
              {isExpanded ? (
                <LuChevronDown className="h-4 w-4" />
              ) : (
                <LuChevronRight className="h-4 w-4" />
              )}
            </button>

            <div>
              <h3 className="text-sm font-semibold text-app">
                Tax-Advantaged Contributions
              </h3>
              <p className="mt-1 text-xs text-muted">
                Annual household buckets sit outside income streams so recurring
                pay and bonuses stay source-specific.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            className="button-primary-small"
            onClick={onEdit}
          >
            Edit Buckets
          </Button>
        </div>

        {isExpanded ? (
          <div
            id={contentId}
            className="mt-4 grid gap-3 border-t section-divider pt-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {TAX_ADVANTAGED_BUCKET_DEFINITIONS.map((bucket) => (
              <article key={bucket.type} className="surface-card-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {bucket.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-app">
                  {formatWholeCurrency(entryMap.get(bucket.type) ?? 0)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {bucket.behaviorLabel}
                </p>
                <p className="mt-1 text-sm text-muted">{bucket.description}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
