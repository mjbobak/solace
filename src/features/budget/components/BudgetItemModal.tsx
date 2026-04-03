import React, { useEffect, useState } from 'react';
import { BiRepeat } from 'react-icons/bi';
import { BsInfoCircle } from 'react-icons/bs';

import type { BudgetEntry } from '@/features/budget/types/budgetView';
import { Button } from '@/shared/components/Button';
import { CustomDropdown } from '@/shared/components/CustomDropdown';
import type { DropdownOption } from '@/shared/components/CustomDropdown';
import { Modal } from '@/shared/components/Modal';
import { ToggleButtonGroup } from '@/shared/components/ToggleButtonGroup';
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expense Type
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expense Category
          </label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment
          </label>
          <ToggleButtonGroup
            value={formData.isInvestment}
            onChange={(value) => handleChange('isInvestment', value)}
            options={[
              { value: false, label: 'Not Investment' },
              { value: true, label: 'Investment' },
            ]}
            variant="pill"
          />
          <p className="mt-1 text-xs text-gray-500">
            Investment items flow into wealth and investment reporting even if
            they live under another expense category.
          </p>
        </div>

        {/* Expense Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expense Label
          </label>
          <input
            type="text"
            value={formData.expenseLabel}
            onChange={(e) => handleChange('expenseLabel', e.target.value)}
            placeholder="e.g., Mortgage, Groceries"
            className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.expenseLabel && (
            <p className="text-xs text-red-600 mt-1">{errors.expenseLabel}</p>
          )}
        </div>

        {/* Expense Label Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expense Label Note (Optional)
          </label>
          <textarea
            value={formData.expenseLabelNote}
            onChange={(e) => handleChange('expenseLabelNote', e.target.value)}
            placeholder="e.g., Diapers, Creams, Wipes, etc."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            This note will appear as a tooltip when hovering over the expense
            label
          </p>
        </div>

        {/* Budget Amount Inputs */}
        <div className="space-y-3">
          <p className="text-xs text-gray-600">
            Enter either monthly or annual amount - the other will
            auto-calculate
          </p>

          {/* Monthly Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Amount
            </label>
            <input
              type="number"
              value={formData.monthlyInput}
              onChange={(e) => handleMonthlyChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Annual Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Amount
            </label>
            <input
              type="number"
              value={formData.annualInput}
              onChange={(e) => handleAnnualChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errors.budgeted && (
            <p className="text-xs text-red-600 mt-1">{errors.budgeted}</p>
          )}
        </div>

        {/* Reserve Monthly Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleChange('isAccrual', !formData.isAccrual)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              formData.isAccrual
                ? 'bg-slate-200 text-slate-900 hover:bg-slate-300 ring-1 ring-slate-400'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Reserve Monthly
            </label>
            <BsInfoCircle
              size={14}
              className="text-gray-400 hover:text-gray-600 cursor-help"
              title="Use for bills paid less often than monthly so you can reserve a monthly amount (e.g., taxes, insurance, annual subscriptions)"
            />
          </div>
        </div>

        {/* Edit Mode: Show read-only metrics */}
        {isEditMode && item && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spent:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(item.spent, '$')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining:</span>
              <span
                className={`font-semibold ${
                  item.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(item.remaining, '$')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">% Used:</span>
              <span
                className={`font-semibold ${
                  item.percentage > 100 ? 'text-rose-600' : 'text-gray-900'
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
