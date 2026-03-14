import type {
  TaxAdvantagedBucketEntry,
  TaxAdvantagedInvestments,
  TaxAdvantagedBucketType,
} from '../types/income';

export interface TaxAdvantagedBucketDefinition {
  type: TaxAdvantagedBucketType;
  label: string;
  description: string;
  behaviorLabel: string;
}

export const TAX_ADVANTAGED_BUCKET_DEFINITIONS: TaxAdvantagedBucketDefinition[] =
  [
    {
      type: '401k',
      label: '401k',
      description: 'Payroll retirement contributions that stay invested long-term.',
      behaviorLabel: 'Locked savings',
    },
    {
      type: 'hsa',
      label: 'HSA',
      description: 'Health savings account contributions tracked as long-term savings.',
      behaviorLabel: 'Locked savings',
    },
    {
      type: 'fsa_daycare',
      label: 'FSA Daycare',
      description: 'Dependent care dollars available for eligible current-year spending.',
      behaviorLabel: 'Spendable restricted',
    },
    {
      type: 'fsa_medical',
      label: 'FSA Medical',
      description: 'Medical FSA dollars available for eligible current-year spending.',
      behaviorLabel: 'Spendable restricted',
    },
  ];

export function buildDefaultTaxAdvantagedBuckets(): TaxAdvantagedBucketEntry[] {
  return TAX_ADVANTAGED_BUCKET_DEFINITIONS.map((bucket) => ({
    bucketType: bucket.type,
    annualAmount: 0,
  }));
}

export const EMPTY_TAX_ADVANTAGED_INVESTMENTS: TaxAdvantagedInvestments = {
  entries: buildDefaultTaxAdvantagedBuckets(),
  lockedTotal: 0,
  spendableTotal: 0,
  total: 0,
};

export function normalizeTaxAdvantagedBuckets(
  entries: TaxAdvantagedBucketEntry[] | null | undefined,
): TaxAdvantagedBucketEntry[] {
  const amountsByType = new Map(
    (entries ?? []).map((entry) => [entry.bucketType, entry.annualAmount]),
  );

  return TAX_ADVANTAGED_BUCKET_DEFINITIONS.map((bucket) => ({
    bucketType: bucket.type,
    annualAmount: amountsByType.get(bucket.type) ?? 0,
  }));
}
