import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { getTodayDateOnly } from '@/shared/utils/dateOnly';

import type { AddSourceModalSubmit } from '../../types/incomeView';
import { isPositiveNumber } from '../../utils/incomeValidation';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddSourceModalSubmit) => Promise<void>;
}

export function AddSourceModal({
  isOpen,
  onClose,
  onSubmit,
}: AddSourceModalProps) {
  const today = getTodayDateOnly();
  const [sourceName, setSourceName] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [periodsPerYear, setPeriodsPerYear] = useState('26');
  const [startDate, setStartDate] = useState(today);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSourceName('');
    setGrossAmount('');
    setNetAmount('');
    setPeriodsPerYear('26');
    setStartDate(today);
    setIsSaving(false);
  }, [isOpen, today]);

  const handleSubmit = async () => {
    if (!sourceName.trim()) {
      return;
    }

    if (
      !isPositiveNumber(grossAmount) ||
      !isPositiveNumber(netAmount) ||
      !isPositiveNumber(periodsPerYear) ||
      !startDate
    ) {
      toast.error('Enter a start date and positive amounts before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        sourceName: sourceName.trim(),
        grossAmount: Number(grossAmount),
        netAmount: Number(netAmount),
        periodsPerYear: Number(periodsPerYear),
        startDate,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income Source">
      <div className="space-y-4">
        <Input
          label="Income source"
          value={sourceName}
          onChange={(event) => setSourceName(event.target.value)}
          placeholder="Acme Corp"
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Gross per pay period"
            type="number"
            min="0.01"
            step="0.01"
            value={grossAmount}
            onChange={(event) => setGrossAmount(event.target.value)}
            required
          />
          <Input
            label="Cash net per pay period"
            type="number"
            min="0.01"
            step="0.01"
            value={netAmount}
            onChange={(event) => setNetAmount(event.target.value)}
            required
          />
          <Input
            label="Pay periods per year"
            type="number"
            min="1"
            step="1"
            value={periodsPerYear}
            onChange={(event) => setPeriodsPerYear(event.target.value)}
            required
          />
          <Input
            label="Effective start date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={
              !sourceName.trim() ||
              !startDate ||
              !isPositiveNumber(grossAmount) ||
              !isPositiveNumber(netAmount) ||
              !isPositiveNumber(periodsPerYear)
            }
          >
            Save Source
          </Button>
        </div>
      </div>
    </Modal>
  );
}
