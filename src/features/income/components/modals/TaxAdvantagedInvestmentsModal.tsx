import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';

interface TaxAdvantagedInvestmentsModalProps {
  isOpen: boolean;
  year: number;
  initialContributions401k: number;
  onClose: () => void;
  onSubmit: (input: { contributions401k: number }) => Promise<void>;
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
  initialContributions401k,
  onClose,
  onSubmit,
}: TaxAdvantagedInvestmentsModalProps) {
  const [contributions401k, setContributions401k] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setContributions401k(String(initialContributions401k));
    setIsSaving(false);
  }, [initialContributions401k, isOpen]);

  const handleSubmit = async () => {
    const parsedContributions401k = parseNonNegativeNumber(contributions401k);
    if (parsedContributions401k === null) {
      toast.error('Enter a valid 401k contribution amount before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({ contributions401k: parsedContributions401k });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Advantaged Investments · ${year}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="surface-subtle p-4">
          <p className="text-sm font-semibold text-app">
            Annual tax-advantaged investing
          </p>
          <p className="mt-1 text-sm text-muted">
            Save the household 401k contribution amount for this planning year.
          </p>
        </div>

        <Input
          label="401k contributions"
          type="number"
          min="0"
          step="0.01"
          value={contributions401k}
          onChange={(event) => setContributions401k(event.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={parseNonNegativeNumber(contributions401k) === null}
          >
            Save Investments
          </Button>
        </div>
      </div>
    </Modal>
  );
}
