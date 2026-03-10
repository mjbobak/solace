/**
 * Modal for adding new income entries
 * Handles income stream creation with deduction breakdown
 */

import React, { useState, useMemo } from 'react';

import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { formatCurrency } from '@/shared/utils/currency';

import {
  PAY_PERIODS_OPTIONS,
  DEDUCTION_FIELDS,
} from '../../constants/incomeConfig';
import type {
  Deductions,
  IncomeType,
  IncomeFrequency,
  EffectiveDateRange,
  IncomeEntry,
} from '../../types/income';

import { DateRangeSection } from './DateRangeSection';
import { DeductionsSection } from './DeductionsSection';
import { FormField, TextInput, SelectInput, SectionHeader } from './FormField';
import { IncomeSummaryCard } from './IncomeSummaryCard';
import { PriorityModeToggle } from './PriorityModeToggle';
import { ValidationWarning } from './ValidationWarning';

// Discriminated union for modal modes
type AddIncomeModalProps =
  | {
      mode: 'add-stream';
      isOpen: boolean;
      onClose: () => void;
      onSave: (data: {
        stream: string;
        type: IncomeType;
        frequency?: IncomeFrequency;
        receivedDate?: string;
        grossAmount: number;
        netAmount: number;
        periods: number;
        deductions?: Deductions;
        startDate: string;
        endDate: string | null;
      }) => void;
    }
  | {
      mode: 'add-range';
      isOpen: boolean;
      onClose: () => void;
      onSave: (range: EffectiveDateRange) => void;
      streamName: string;
      existingEntry: IncomeEntry;
      initialData?: Partial<EffectiveDateRange>;
    }
  | {
      mode: 'edit-range';
      isOpen: boolean;
      onClose: () => void;
      onSave: (range: EffectiveDateRange) => void;
      streamName: string;
      existingEntry: IncomeEntry;
      rangeToEdit: EffectiveDateRange;
    };

interface FormState {
  stream: string;
  type: IncomeType;
  receivedDate: string;
  grossPayAmount: string;
  netPayAmount: string;
  periods: string;
  priorityMode: 'gross' | 'net';
  deductions: Record<keyof Deductions, string>;
  startDate: string;
  endDate: string | null;
}

const INITIAL_FORM_STATE: FormState = {
  stream: '',
  type: 'regular',
  receivedDate: '',
  grossPayAmount: '',
  netPayAmount: '',
  periods: '26',
  priorityMode: 'gross',
  deductions: {
    federalTax: '',
    stateTax: '',
    fica: '',
    retirement: '',
    healthInsurance: '',
    other: '',
  },
  startDate: new Date().toISOString().split('T')[0],
  endDate: null,
};

const INCOME_TYPE_OPTIONS = [
  { value: 'regular', label: 'Regular Income (Salary, Wages)' },
  { value: 'bonus', label: 'Bonus Income (Bonuses, Irregular Income)' },
];

export const AddIncomeModal: React.FC<AddIncomeModalProps> = (props) => {
  const { isOpen, onClose, mode } = props;

  // Initialize form state based on mode
  const getInitialFormState = (): FormState => {
    const baseState = { ...INITIAL_FORM_STATE };

    if (mode === 'add-range' && 'initialData' in props) {
      // Mode 2: Add range with smart defaults
      const defaults = props.initialData;
      if (defaults) {
        baseState.startDate = defaults.startDate || baseState.startDate;
        baseState.endDate = defaults.endDate || null;
        baseState.grossPayAmount = defaults.grossAmount?.toString() || '';
        baseState.netPayAmount = defaults.netAmount?.toString() || '';
        baseState.periods = defaults.periods?.toString() || '26';
        if (defaults.deductions) {
          Object.entries(defaults.deductions).forEach(([key, value]) => {
            baseState.deductions[key as keyof Deductions] =
              value?.toString() || '';
          });
        }
      }
    } else if (mode === 'edit-range' && 'rangeToEdit' in props) {
      // Mode 3: Edit range with pre-filled data
      const range = props.rangeToEdit;
      baseState.startDate = range.startDate;
      baseState.endDate = range.endDate;
      baseState.grossPayAmount = range.grossAmount.toString();
      baseState.netPayAmount = range.netAmount.toString();
      baseState.periods = range.periods.toString();
      if (range.deductions) {
        Object.entries(range.deductions).forEach(([key, value]) => {
          baseState.deductions[key as keyof Deductions] =
            value?.toString() || '';
        });
      }
    }

    return baseState;
  };

  const [formData, setFormData] = useState<FormState>(getInitialFormState());
  const [showDeductions, setShowDeductions] = useState(false);

  // Parse numeric values
  const grossPayAmount = parseFloat(formData.grossPayAmount) || 0;
  const enteredNetPayAmount = parseFloat(formData.netPayAmount) || 0;
  const periods = parseInt(formData.periods) || 26;

  // Calculate total deductions
  const totalDeductionsPerPeriod = DEDUCTION_FIELDS.reduce((sum, field) => {
    const amount =
      parseFloat(formData.deductions[field.key as keyof Deductions]) || 0;
    return sum + amount;
  }, 0);

  // Derived calculations
  const netPayAmount =
    enteredNetPayAmount || grossPayAmount - totalDeductionsPerPeriod;
  const annualGross = grossPayAmount * periods;
  const annualNet = netPayAmount * periods;
  const hasDeductions = totalDeductionsPerPeriod > 0;

  // Validation: Check if GROSS - DEDUCTIONS = NET
  const validationWarning = useMemo(() => {
    if (!grossPayAmount || !enteredNetPayAmount || !hasDeductions) return null;

    const calculatedNet = grossPayAmount - totalDeductionsPerPeriod;
    const difference = Math.abs(calculatedNet - enteredNetPayAmount);

    if (difference <= 0.01) return null;

    return `Calculated net (${formatCurrency(
      calculatedNet,
      '$',
    )}) differs from entered net (${formatCurrency(
      enteredNetPayAmount,
      '$',
    )}) by ${formatCurrency(difference, '$')}`;
  }, [
    grossPayAmount,
    enteredNetPayAmount,
    totalDeductionsPerPeriod,
    hasDeductions,
  ]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowDeductions(false);
    onClose();
  };

  const handleSubmit = () => {
    // Validate based on mode
    if (mode === 'add-stream') {
      if (!formData.stream) return;

      const hasRequiredAmount =
        formData.priorityMode === 'gross'
          ? formData.grossPayAmount
          : formData.netPayAmount;

      if (!hasRequiredAmount) return;
      if (formData.type === 'bonus' && !formData.receivedDate) return;
    } else if (mode === 'add-range' || mode === 'edit-range') {
      // For range modes, validate date range
      if (!formData.startDate) return;
      if (
        formData.endDate &&
        new Date(formData.startDate) >= new Date(formData.endDate)
      ) {
        return; // Start date must be before end date
      }

      const hasRequiredAmount =
        formData.priorityMode === 'gross'
          ? formData.grossPayAmount
          : formData.netPayAmount;

      if (!hasRequiredAmount) return;
    }

    // Build deductions object, excluding zero values
    const deductionsObj: Deductions = {};
    DEDUCTION_FIELDS.forEach((field) => {
      const amount =
        parseFloat(formData.deductions[field.key as keyof Deductions]) || 0;
      if (amount > 0) {
        deductionsObj[field.key as keyof Deductions] = amount;
      }
    });

    // Determine final values based on priority mode
    let finalGross = grossPayAmount;
    let finalNet = netPayAmount;

    if (!validationWarning) {
      if (formData.priorityMode === 'net') {
        finalGross = enteredNetPayAmount + totalDeductionsPerPeriod;
      } else {
        finalNet = grossPayAmount - totalDeductionsPerPeriod;
      }
    }

    // Call appropriate save handler based on mode
    if (mode === 'add-stream') {
      const onSave = 'onSave' in props ? props.onSave : null;
      if (onSave) {
        onSave({
          stream: formData.stream,
          type: formData.type,
          frequency: formData.type === 'bonus' ? 'one-time' : undefined,
          receivedDate:
            formData.type === 'bonus' ? formData.receivedDate : undefined,
          grossAmount: finalGross,
          netAmount: finalNet,
          periods,
          deductions:
            Object.keys(deductionsObj).length > 0 ? deductionsObj : undefined,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      }
    } else {
      // Modes: add-range, edit-range
      const onSave = 'onSave' in props ? props.onSave : null;
      if (onSave) {
        const rangeData: EffectiveDateRange = {
          id:
            mode === 'edit-range' && 'rangeToEdit' in props
              ? props.rangeToEdit.id
              : `range-${Date.now()}`,
          startDate: formData.startDate,
          endDate: formData.endDate,
          grossAmount: finalGross,
          netAmount: finalNet,
          periods,
          deductions:
            Object.keys(deductionsObj).length > 0 ? deductionsObj : undefined,
        };
        onSave(rangeData);
      }
    }

    handleClose();
  };

  // Determine form validity based on mode
  const isFormValid =
    mode === 'add-stream'
      ? formData.stream &&
        (formData.priorityMode === 'gross'
          ? formData.grossPayAmount
          : formData.netPayAmount)
      : formData.startDate &&
        (!formData.endDate ||
          new Date(formData.startDate) < new Date(formData.endDate)) &&
        (formData.priorityMode === 'gross'
          ? formData.grossPayAmount
          : formData.netPayAmount);

  // Determine modal title based on mode
  const modalTitle =
    mode === 'add-stream'
      ? 'Add Income Stream'
      : mode === 'add-range' && 'streamName' in props
        ? `Add Income Range: ${props.streamName}`
        : mode === 'edit-range' && 'streamName' in props
          ? `Edit Income Range: ${props.streamName}`
          : 'Income Range';

  // Determine button text based on mode
  const submitButtonText =
    mode === 'add-stream'
      ? 'Add Income'
      : mode === 'add-range'
        ? 'Add Range'
        : 'Save Range';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth="3xl"
    >
      <div className="grid grid-cols-3 gap-8">
        {/* Main Form Column */}
        <div className="col-span-2 space-y-8">
          {/* Stream Name Header - Only in modes 2 & 3 */}
          {(mode === 'add-range' || mode === 'edit-range') &&
            'streamName' in props && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Income Stream
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {props.streamName}
                </p>
              </div>
            )}

          {/* Income Details Section - Only in mode 1 */}
          {mode === 'add-stream' && (
            <div className="space-y-4">
              <SectionHeader>Income Details</SectionHeader>

              <FormField label="Income Stream Name" required>
                <TextInput
                  value={formData.stream}
                  onChange={(v) => updateField('stream', v)}
                  placeholder="e.g., Salary, Side Gig, Bonus"
                />
              </FormField>

              <FormField label="Income Type">
                <SelectInput
                  value={formData.type}
                  onChange={(v) => updateField('type', v as IncomeType)}
                  options={INCOME_TYPE_OPTIONS}
                />
              </FormField>

              {formData.type === 'regular' && (
                <FormField
                  label="Pay Periods Per Year"
                  hint="How often you receive this income"
                >
                  <SelectInput
                    value={formData.periods}
                    onChange={(v) => updateField('periods', v)}
                    options={PAY_PERIODS_OPTIONS}
                  />
                </FormField>
              )}

              {formData.type === 'bonus' && (
                <FormField
                  label="Date Received"
                  required
                  hint="Required: When this bonus was or will be received"
                >
                  <TextInput
                    type="date"
                    value={formData.receivedDate}
                    onChange={(v) => updateField('receivedDate', v)}
                  />
                </FormField>
              )}
            </div>
          )}

          {/* Pay Periods - Visible in all modes */}
          {(mode === 'add-range' || mode === 'edit-range') && (
            <div className="space-y-4">
              <SectionHeader>Pay Frequency</SectionHeader>
              <FormField label="Pay Periods Per Year">
                <SelectInput
                  value={formData.periods}
                  onChange={(v) => updateField('periods', v)}
                  options={PAY_PERIODS_OPTIONS}
                />
              </FormField>
            </div>
          )}

          {/* Compensation Section */}
          <div className="space-y-4 border-t border-gray-100 pt-8">
            <SectionHeader>Compensation</SectionHeader>

            <PriorityModeToggle
              value={formData.priorityMode}
              onChange={(v) => updateField('priorityMode', v)}
            />

            <FormField
              label="Gross Pay Amount"
              required={formData.priorityMode === 'gross'}
              isPrimary={formData.priorityMode === 'gross'}
              hint="Before deductions (per pay period)"
            >
              <TextInput
                type="number"
                step="0.01"
                value={formData.grossPayAmount}
                onChange={(v) => updateField('grossPayAmount', v)}
                placeholder="0.00"
                highlighted={formData.priorityMode === 'gross'}
              />
            </FormField>

            <FormField
              label="Net Pay Amount"
              required={formData.priorityMode === 'net'}
              isPrimary={formData.priorityMode === 'net'}
              hint="After deductions (per pay period)"
            >
              <TextInput
                type="number"
                step="0.01"
                value={formData.netPayAmount}
                onChange={(v) => updateField('netPayAmount', v)}
                placeholder="0.00"
                highlighted={formData.priorityMode === 'net'}
              />
            </FormField>
          </div>

          {/* Date Range Section - Only in modes 2 & 3 */}
          {(mode === 'add-range' || mode === 'edit-range') && (
            <DateRangeSection
              startDate={formData.startDate}
              endDate={formData.endDate}
              onStartDateChange={(v) => updateField('startDate', v)}
              onEndDateChange={(v) => updateField('endDate', v)}
            />
          )}

          {/* Deductions Section */}
          <DeductionsSection
            deductions={formData.deductions}
            onDeductionChange={(key, value) =>
              setFormData((prev) => ({
                ...prev,
                deductions: { ...prev.deductions, [key]: value },
              }))
            }
            totalDeductions={totalDeductionsPerPeriod}
            isExpanded={showDeductions}
            onToggle={() => setShowDeductions(!showDeductions)}
          />

          {/* Validation Warning */}
          {validationWarning && (
            <ValidationWarning message={validationWarning} />
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="col-span-1">
          <IncomeSummaryCard
            grossPayAmount={grossPayAmount}
            netPayAmount={netPayAmount}
            annualGross={annualGross}
            annualNet={annualNet}
            monthlyGross={annualGross / 12}
            monthlyNet={annualNet / 12}
          />
        </div>

        {/* Actions */}
        <div className="col-span-3 flex gap-3 pt-8 border-t border-gray-100">
          <Button onClick={handleClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            className="flex-1"
            disabled={!isFormValid}
          >
            {submitButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
