import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { getTodayDateOnly } from '@/shared/utils/dateOnly';

import type {
  AnnualAdjustment,
  AnnualAdjustmentStatus,
  CreateAnnualAdjustmentInput,
} from '../../types/income';

interface AnnualAdjustmentModalProps {
  isOpen: boolean;
  adjustment: AnnualAdjustment | null;
  year: number;
  onClose: () => void;
  onSubmit: (input: CreateAnnualAdjustmentInput) => Promise<void>;
}

function isNonZeroNumber(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0;
}

function buildAnnualAdjustmentInput(params: {
  year: number;
  label: string;
  effectiveDate: string;
  status: AnnualAdjustmentStatus;
  amount: string;
}): CreateAnnualAdjustmentInput {
  return {
    year: params.year,
    label: params.label.trim(),
    effectiveDate: params.effectiveDate,
    status: params.status,
    amount: Number(params.amount),
  };
}

export function AnnualAdjustmentModal({
  isOpen,
  adjustment,
  year,
  onClose,
  onSubmit,
}: AnnualAdjustmentModalProps) {
  const [label, setLabel] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(getTodayDateOnly());
  const [status, setStatus] = useState<AnnualAdjustmentStatus>('expected');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = adjustment !== null;

  useEffect(() => {
    setLabel(adjustment?.label ?? '');
    setEffectiveDate(adjustment?.effectiveDate ?? `${year}-01-01`);
    setStatus(adjustment?.status ?? 'expected');
    setAmount(adjustment ? String(adjustment.amount) : '');
    setIsSaving(false);
  }, [adjustment, isOpen, year]);

  const handleSubmit = async () => {
    if (!label.trim() || !effectiveDate || !isNonZeroNumber(amount)) {
      toast.error('Enter a label, date, and non-zero amount before saving.');
      return;
    }

    const input = buildAnnualAdjustmentInput({
      year,
      label,
      effectiveDate,
      status,
      amount,
    });

    setIsSaving(true);
    try {
      await onSubmit(input);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Annual Adjustment' : 'Add Annual Adjustment'}
    >
      <div className="space-y-4">
        <Input
          label="Adjustment label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Federal tax refund"
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Effective date"
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
            required
          />
          <label>
            <span className="form-label">Status</span>
            <select
              className="form-input"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AnnualAdjustmentStatus)
              }
            >
              <option value="expected">Expected</option>
              <option value="actual">Actual</option>
            </select>
          </label>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="2500 or -1800"
            required
          />
        </div>

        <p className="text-sm text-muted">
          Positive amounts increase cash net. Negative amounts represent
          outflows like tax balances due.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={!label.trim() || !effectiveDate || !isNonZeroNumber(amount)}
          >
            {isEditing ? 'Save Changes' : 'Save Adjustment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
