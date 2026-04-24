import React, { useEffect, useState } from 'react';
import { BiRepeat } from 'react-icons/bi';
import { BsInfoCircle } from 'react-icons/bs';
import { LuTrendingUp } from 'react-icons/lu';

import type { BudgetEntry } from '@/features/budget/types/budgetView';
import { Button } from '@/shared/components/Button';
import { CustomDropdown } from '@/shared/components/CustomDropdown';
import type { DropdownOption } from '@/shared/components/CustomDropdown';
import { Input, Textarea } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { budgetModalTheme } from '@/shared/theme';
import type { ExpenseCategory } from '@/shared/types/category';
import { formatCurrency } from '@/shared/utils/currency';

interface BudgetItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    item: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
  ) => void;
  item?: BudgetEntry;
  expenseTypes: string[];
  expenseCategories: string[];
  onAddCustomCategory?: (value: string) => Promise<ExpenseCategory>;
}

interface FormData {
  expenseType: 'ESSENTIAL' | 'FUNSIES';
  expenseCategory: string;
  expenseLabel: string;
  expenseLabelNote: string;
  isInvestment: boolean;
  budgeted: number;
  monthlyInput: number | '';
  annualInput: number | '';
  isAccrual: boolean;
}

interface FormErrors {
  expenseLabel?: string;
  budgeted?: string;
}

export const BudgetItemModal: React.FC<BudgetItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  expenseTypes,
  expenseCategories,
  onAddCustomCategory,
}) => {
  const isEditMode = !!item;
  const title = isEditMode ? 'Edit Budget Item' : 'Add Budget Item';

  const [formData, setFormData] = useState<FormData>({
    expenseType: 'ESSENTIAL',
    expenseCategory: 'DAILY LIVING',
    expenseLabel: '',
    expenseLabelNote: '',
    isInvestment: false,
    budgeted: 0,
    monthlyInput: '',
    annualInput: '',
    isAccrual: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize form with item data when editing
  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        expenseType: item.expenseType,
        expenseCategory: item.expenseCategory,
        expenseLabel: item.expenseLabel,
        expenseLabelNote: item.expenseLabelNote || '',
        isInvestment: item.isInvestment ?? false,
        budgeted: item.budgeted,
        monthlyInput: item.budgeted,
        annualInput: item.budgeted * 12,
        isAccrual: item.isAccrual ?? false,
      });
      setErrors({});
    } else if (isOpen) {
      // Reset form for add mode
      setFormData({
        expenseType: 'ESSENTIAL',
        expenseCategory: 'DAILY LIVING',
        expenseLabel: '',
        expenseLabelNote: '',
        isInvestment: false,
        budgeted: 0,
        monthlyInput: '',
        annualInput: '',
        isAccrual: false,
      });
      setErrors({});
    }
  }, [isOpen, isEditMode, item]);

  // Round to 2 decimal places
  const roundToTwoDecimals = (value: number): number => {
    return Math.round(value * 100) / 100;
  };

  const handleMonthlyChange = (value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setFormData((prev) => ({
      ...prev,
      monthlyInput: numValue,
      annualInput: numValue === '' ? '' : roundToTwoDecimals(numValue * 12),
      budgeted: numValue === '' ? 0 : numValue,
    }));
    // Clear error
    if (errors.budgeted) {
      setErrors((prev) => ({ ...prev, budgeted: undefined }));
    }
  };

  const handleAnnualChange = (value: string) => {
    const numValue = value === '' ? '' : Number(value);
    const monthly = numValue === '' ? 0 : roundToTwoDecimals(numValue / 12);
    setFormData((prev) => ({
      ...prev,
      annualInput: numValue,
      monthlyInput: numValue === '' ? '' : monthly,
      budgeted: monthly,
    }));
    // Clear error
    if (errors.budgeted) {
      setErrors((prev) => ({ ...prev, budgeted: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.expenseLabel.trim()) {
      newErrors.expenseLabel = 'Expense label is required';
    }

    if (formData.budgeted < 0) {
      newErrors.budgeted = 'Budgeted amount must be non-negative';
    }

    if (formData.budgeted === 0) {
      newErrors.budgeted = 'Please enter a budget amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Transform formData to match BudgetEntry type (excluding id, spent, remaining, percentage)
    onSave({
      expenseType: formData.expenseType,
      expenseCategory: formData.expenseCategory,
      expenseLabel: formData.expenseLabel,
      expenseLabelNote: formData.expenseLabelNote,
      isInvestment: formData.isInvestment,
      budgeted: formData.budgeted,
      isAccrual: formData.isAccrual,
    });
    onClose();
  };

  const handleChange = (
    field: keyof FormData,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Expense Type */}
        <div>
          <label className="form-label">Expense Type</label>
          <CustomDropdown
            value={formData.expenseType}
            options={expenseTypes.map((type) => ({ value: type, label: type }))}
            onChange={(selectedValue) => {
              handleChange('expenseType', selectedValue);
            }}
          />
        </div>

        {/* Expense Category */}
        <div>
          <label className="form-label">Expense Category</label>
          <CustomDropdown
            value={formData.expenseCategory}
            options={
              [
                { value: '+ Add', label: '+ Add', isAddNew: true },
                ...expenseCategories.map((cat) => ({ value: cat, label: cat })),
              ] as DropdownOption[]
            }
            onChange={(selectedValue) => {
              handleChange('expenseCategory', selectedValue);
            }}
            onAddNew={async (newValue) => {
              if (onAddCustomCategory) {
                try {
                  await onAddCustomCategory(newValue);
                  handleChange('expenseCategory', newValue);
                } catch (error) {
                  // Error is already toasted by the hook
                  console.error('Failed to add category:', error);
                }
              }
            }}
          />
        </div>

        {/* Expense Label */}
        <div>
          <Input
            type="text"
            value={formData.expenseLabel}
            onChange={(e) => handleChange('expenseLabel', e.target.value)}
            placeholder="e.g., Mortgage, Groceries"
            label="Expense Label"
            error={errors.expenseLabel}
            className="rounded-full text-sm"
          />
        </div>

        {/* Expense Label Note */}
        <div>
          <Textarea
            value={formData.expenseLabelNote}
            onChange={(e) => handleChange('expenseLabelNote', e.target.value)}
            placeholder="e.g., Diapers, Creams, Wipes, etc."
            rows={2}
            maxLength={500}
            label="Expense Label Note (Optional)"
            className="text-sm"
          />
          <p className="mt-1 text-sm text-muted">
            This note will appear as a tooltip when hovering over the expense
            label
          </p>
        </div>

        {/* Budget Amount Inputs */}
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Enter either monthly or annual amount - the other will
            auto-calculate
          </p>

          {/* Monthly Amount */}
          <div>
            <Input
              type="number"
              value={formData.monthlyInput}
              onChange={(e) => handleMonthlyChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              label="Monthly Amount"
              className="rounded-full text-sm"
            />
          </div>

          {/* Annual Amount */}
          <div>
            <Input
              type="number"
              value={formData.annualInput}
              onChange={(e) => handleAnnualChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              label="Annual Amount"
              className="rounded-full text-sm"
            />
          </div>

          {errors.budgeted && (
            <p className="form-error">{errors.budgeted}</p>
          )}
        </div>

        {/* Reserve Monthly Toggle */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-muted">Investment</label>
              <BsInfoCircle
                size={14}
                className="cursor-help text-muted transition-colors hover:text-app"
                title="Investment items flow into wealth and investment reporting even if they live under another expense category"
              />
            </div>
            <button
              type="button"
              onClick={() => handleChange('isInvestment', !formData.isInvestment)}
              className={`${budgetModalTheme.toggleButton} ${
                formData.isInvestment
                  ? `${budgetModalTheme.toggleButtonActive} ${budgetModalTheme.investmentToggleActive}`
                  : budgetModalTheme.toggleButtonInactive
              }`}
              title={
                formData.isInvestment
                  ? 'Mark this budget item as not an investment'
                  : 'Mark this budget item as an investment'
              }
            >
              <LuTrendingUp size={14} />
              {formData.isInvestment ? 'Investment' : 'Not Investment'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-muted">
                Reserve Monthly
              </label>
              <BsInfoCircle
                size={14}
                className="cursor-help text-muted transition-colors hover:text-app"
                title="Use for bills paid less often than monthly so you can reserve a monthly amount (e.g., taxes, insurance, annual subscriptions)"
              />
            </div>
            <button
              type="button"
              onClick={() => handleChange('isAccrual', !formData.isAccrual)}
              className={`${budgetModalTheme.toggleButton} ${
                formData.isAccrual
                  ? `${budgetModalTheme.toggleButtonActive} ${budgetModalTheme.reserveToggleActive}`
                  : budgetModalTheme.toggleButtonInactive
              }`}
              title={
                formData.isAccrual
                  ? 'Disable monthly reserve for this budget item'
                  : 'Enable monthly reserve for this budget item'
              }
            >
              <BiRepeat size={14} />
              {formData.isAccrual ? 'Reserved' : 'Reserve Monthly'}
            </button>
          </div>
        </div>

        {/* Edit Mode: Show read-only metrics */}
        {isEditMode && item && (
          <div className="surface-subtle space-y-2 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Spent:</span>
              <span className="font-semibold text-app">
                {formatCurrency(item.spent, '$')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Remaining:</span>
              <span
                className={`font-semibold ${
                  item.remaining < 0 ? 'text-danger' : 'text-success'
                }`}
              >
                {formatCurrency(item.remaining, '$')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">% Used:</span>
              <span
                className={`font-semibold ${
                  item.percentage > 100 ? 'text-danger' : 'text-app'
                }`}
              >
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!formData.expenseLabel.trim()}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
