import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { getTodayDateOnly } from '@/shared/utils/dateOnly';

import type {
  IncomeOccurrence,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
} from '../../types/income';
import { getComponentDisplayName } from '../../types/income';
import type { BonusOccurrenceModalSubmit } from '../../types/incomeView';

interface BonusOccurrenceModalProps {
  isOpen: boolean;
  source: ProjectedIncomeSource | null;
  component?: ProjectedIncomeComponent | null;
  occurrence?: IncomeOccurrence | null;
  onClose: () => void;
  onSubmit: BonusOccurrenceModalSubmit;
}

export function BonusOccurrenceModal({
  isOpen,
  source,
  component,
  occurrence,
  onClose,
  onSubmit,
}: BonusOccurrenceModalProps) {
  const bonusComponents = useMemo(
    () =>
      source?.components.filter(
        (entry) => entry.componentMode === 'occurrence',
      ) ?? [],
    [source],
  );
  const isEditing = Boolean(component && occurrence);
  const [componentChoice, setComponentChoice] = useState('new');
  const [label, setLabel] = useState('Annual bonus');
  const [status, setStatus] = useState<IncomeOccurrence['status']>('expected');
  const [plannedDate, setPlannedDate] = useState(getTodayDateOnly());
  const [paidDate, setPaidDate] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (component && occurrence) {
      setComponentChoice(String(component.id));
      setLabel(component.label ?? 'Bonus');
      setStatus(occurrence.status);
      setPlannedDate(occurrence.plannedDate);
      setPaidDate(occurrence.paidDate ?? '');
      setGrossAmount(String(occurrence.grossAmount));
      setNetAmount(String(occurrence.netAmount));
      setIsSaving(false);
      return;
    }

    const defaultChoice =
      bonusComponents.length > 0 ? String(bonusComponents[0].id) : 'new';
    setComponentChoice(defaultChoice);
    setLabel(bonusComponents[0]?.label ?? 'Annual bonus');
    setStatus('expected');
    setPlannedDate(getTodayDateOnly());
    setPaidDate('');
    setGrossAmount('');
    setNetAmount('');
    setIsSaving(false);
  }, [bonusComponents, component, isOpen, occurrence]);

  const buildOccurrencePayload = () => ({
    status,
    plannedDate,
    paidDate: status === 'actual' ? paidDate || plannedDate : null,
    grossAmount: Number(grossAmount),
    netAmount: Number(netAmount),
  });

  const handleSubmit = async () => {
    if (isEditing && component && occurrence) {
      setIsSaving(true);
      try {
        await onSubmit(occurrence.id, {
          componentId: component.id,
          label: label.trim(),
          occurrence: buildOccurrencePayload(),
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!source) {
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(source.id, {
        existingBonusComponentId:
          componentChoice === 'new' ? null : Number(componentChoice),
        label: label.trim(),
        occurrence: buildOccurrencePayload(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Bonus Event' : 'Add Bonus'}
    >
      <div className="space-y-4">
        {!isEditing && (
          <label>
            <span className="form-label">Bonus component</span>
            <select
              className="form-input"
              value={componentChoice}
              onChange={(event) => setComponentChoice(event.target.value)}
            >
              {bonusComponents.map((bonusComponent) => (
                <option key={bonusComponent.id} value={bonusComponent.id}>
                  {getComponentDisplayName(bonusComponent)}
                </option>
              ))}
              <option value="new">Create new bonus component</option>
            </select>
          </label>
        )}

        {!isEditing && componentChoice === 'new' && (
          <Input
            label="Bonus label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Annual bonus"
            required
          />
        )}

        {isEditing && component && (
          <>
            <Input
              label="Bonus label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Annual bonus"
              required
            />
            <div className="surface-subtle p-4">
              <p className="text-sm font-semibold text-app">
                {getComponentDisplayName(component)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Update the bonus label and event details for this income stream.
              </p>
            </div>
          </>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="form-label">Status</span>
            <select
              className="form-input"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as IncomeOccurrence['status'])
              }
            >
              <option value="expected">Expected</option>
              <option value="actual">Actual</option>
            </select>
          </label>
          <Input
            label="Planned date"
            type="date"
            value={plannedDate}
            onChange={(event) => setPlannedDate(event.target.value)}
            required
          />
          {status === 'actual' && (
            <Input
              label="Paid date"
              type="date"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
            />
          )}
          <Input
            label="Gross amount"
            type="number"
            min="0"
            step="0.01"
            value={grossAmount}
            onChange={(event) => setGrossAmount(event.target.value)}
            required
          />
          <Input
            label="Cash net amount"
            type="number"
            min="0"
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
              !label.trim() || !grossAmount || !netAmount || !plannedDate
            }
          >
            {isEditing ? 'Save Changes' : 'Save Bonus'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
