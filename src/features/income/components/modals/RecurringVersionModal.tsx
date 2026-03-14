import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';

import type {
  ProjectedIncomeComponent,
  RecurringIncomeVersion,
} from '../../types/income';
import { getComponentDisplayName } from '../../types/income';
import type { RecurringVersionModalSubmit } from '../../types/incomeView';
import { isPositiveNumber } from '../../utils/incomeValidation';
import { getDefaultChangeStartDate } from '../../utils/incomeViewFormatters';

interface RecurringVersionModalProps {
  isOpen: boolean;
  component: ProjectedIncomeComponent | null;
  version?: RecurringIncomeVersion | null;
  selectedYear: number;
  onClose: () => void;
  onSubmit: RecurringVersionModalSubmit;
}

export function RecurringVersionModal({
  isOpen,
  component,
  version,
  selectedYear,
  onClose,
  onSubmit,
}: RecurringVersionModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [periodsPerYear, setPeriodsPerYear] = useState('26');
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(version);

  useEffect(() => {
    if (!component) {
      return;
    }

    if (version) {
      setStartDate(version.startDate);
      setEndDate(version.endDate ?? '');
      setGrossAmount(String(version.grossAmount));
      setNetAmount(String(version.netAmount));
      setPeriodsPerYear(String(version.periodsPerYear));
    } else {
      setStartDate(getDefaultChangeStartDate(component, selectedYear));
      setEndDate('');
      setGrossAmount(String(component.currentVersion?.grossAmount ?? ''));
      setNetAmount(String(component.currentVersion?.netAmount ?? ''));
      setPeriodsPerYear(String(component.currentVersion?.periodsPerYear ?? 26));
    }

    setIsSaving(false);
  }, [component, selectedYear, version]);

  const handleSubmit = async () => {
    if (!component) {
      return;
    }

    if (
      !startDate ||
      !isPositiveNumber(grossAmount) ||
      !isPositiveNumber(netAmount) ||
      !isPositiveNumber(periodsPerYear)
    ) {
      toast.error('Enter a start date and positive amounts before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(version?.id ?? component.id, {
        startDate,
        endDate: endDate || null,
        grossAmount: Number(grossAmount),
        netAmount: Number(netAmount),
        periodsPerYear: Number(periodsPerYear),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Compensation Change' : 'Add Compensation Change'}
    >
      <div className="space-y-4">
        <div className="surface-subtle p-4">
          <p className="text-sm font-semibold text-app">
            {component ? getComponentDisplayName(component) : 'Recurring pay'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {isEditing
              ? 'Update the effective range and pay details for this recurring version.'
              : 'Adding a new version will auto-close the prior active version on the day before the new start date.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Effective start date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          <Input
            label="Effective end date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
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
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={
              !startDate ||
              !isPositiveNumber(grossAmount) ||
              !isPositiveNumber(netAmount) ||
              !isPositiveNumber(periodsPerYear)
            }
          >
            {isEditing ? 'Save Changes' : 'Save Change'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
