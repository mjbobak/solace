import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';

import {
  TAX_ADVANTAGED_BUCKET_DEFINITIONS,
  normalizeTaxAdvantagedBuckets,
} from '../../constants/taxAdvantagedBuckets';
import type { TaxAdvantagedBucketEntry } from '../../types/income';

interface TaxAdvantagedInvestmentsModalProps {
  isOpen: boolean;
  year: number;
  initialEntries: TaxAdvantagedBucketEntry[];
  onClose: () => void;
  onSubmit: (input: {
    taxAdvantagedBuckets: TaxAdvantagedBucketEntry[];
  }) => Promise<void>;
}

function buildAmountsByType(
  entries: TaxAdvantagedBucketEntry[],
): Record<string, string> {
  return Object.fromEntries(
    normalizeTaxAdvantagedBuckets(entries).map((entry) => [
      entry.bucketType,
      String(entry.annualAmount),
    ]),
  );
}

function parseNonNegativeNumber(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
}

export function TaxAdvantagedInvestmentsModal({
  isOpen,
  year,
  initialEntries,
  onClose,
  onSubmit,
}: TaxAdvantagedInvestmentsModalProps) {
  const [amountsByType, setAmountsByType] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAmountsByType(buildAmountsByType(initialEntries));
    setIsSaving(false);
  }, [initialEntries, isOpen]);

  const normalizedEntries = useMemo(
    () =>
      normalizeTaxAdvantagedBuckets(
        TAX_ADVANTAGED_BUCKET_DEFINITIONS.map((bucket) => ({
          bucketType: bucket.type,
          annualAmount: parseNonNegativeNumber(amountsByType[bucket.type] ?? '') ?? 0,
        })),
      ),
    [amountsByType],
  );

  const hasInvalidValue = TAX_ADVANTAGED_BUCKET_DEFINITIONS.some(
    (bucket) => parseNonNegativeNumber(amountsByType[bucket.type] ?? '') === null,
  );

  const handleSubmit = async () => {
    if (hasInvalidValue) {
      toast.error('Enter valid non-negative annual amounts before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({ taxAdvantagedBuckets: normalizedEntries });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax-Advantaged Buckets · ${year}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="surface-subtle p-4">
          <p className="text-sm font-semibold text-app">
            Annual household payroll-style buckets
          </p>
          <p className="mt-1 text-sm text-muted">
            Capture annual 401k, HSA, and FSA amounts separately from recurring
            pay so income streams stay focused on employer compensation.
          </p>
        </div>

        <div className="space-y-3">
          {TAX_ADVANTAGED_BUCKET_DEFINITIONS.map((bucket) => (
            <div
              key={bucket.type}
              className="grid gap-3 rounded-xl border border-app bg-white p-4 md:grid-cols-[1.3fr_1fr]"
            >
              <div>
                <p className="text-sm font-semibold text-app">{bucket.label}</p>
                <p className="mt-1 text-sm text-muted">{bucket.description}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {bucket.behaviorLabel}
                </p>
              </div>
              <Input
                label={`${bucket.label} annual amount`}
                type="number"
                min="0"
                step="0.01"
                value={amountsByType[bucket.type] ?? '0'}
                onChange={(event) =>
                  setAmountsByType((current) => ({
                    ...current,
                    [bucket.type]: event.target.value,
                  }))
                }
                required
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={hasInvalidValue}
          >
            Save Buckets
          </Button>
        </div>
      </div>
    </Modal>
  );
}
