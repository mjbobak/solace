import React, { useEffect, useState } from 'react';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import type { SpendingEntry } from '@/features/spending/types/spendingView';
import {
  addMonthsToMonthInput,
  getFiscalYearMonthRange,
  getInclusiveMonthCount,
  getSpreadEndDate,
  getSpreadPaymentConfig,
  monthInputToIsoDate,
  toMonthInputValue,
} from '@/features/spending/utils/spreadPayments';
import { AnchoredPopover } from '@/shared/components/AnchoredPopover';
import { Button } from '@/shared/components/Button';
import { CustomDropdown } from '@/shared/components/CustomDropdown';
import type { DropdownOption } from '@/shared/components/CustomDropdown';
import { formatCurrency } from '@/shared/utils/currency';

const PRESET_MONTHS = [3, 6, 12] as const;

interface EditTransactionPopoverProps {
  isOpen: boolean;
  transaction: SpendingEntry | null;
  anchorElement: HTMLButtonElement | null;
  budgets: BudgetApiResponse[];
  accounts: string[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<SpendingEntry>) => void;
}

interface EditFormData {
  account: string;
  transactionDate: string;
  description: string;
  budgetId: number | null;
  budgetLabel: string;
  budgetCategory: string | undefined;
  budgetType: string | undefined;
  amount: string;
  spreadStartMonth: string;
  spreadEndMonth: string;
}

export const EditTransactionPopover: React.FC<EditTransactionPopoverProps> = ({
  isOpen,
  transaction,
  anchorElement,
  budgets,
  accounts,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<EditFormData | null>(null);

  useEffect(() => {
    if (!isOpen || !transaction) {
      setFormData(null);
      return;
    }

    const spreadConfig = getSpreadPaymentConfig(transaction);
    setFormData({
      account: transaction.account,
      transactionDate: transaction.transactionDate,
      description: transaction.description,
      budgetId: transaction.budgetId ?? null,
      budgetLabel: transaction.budgetLabel,
      budgetCategory: transaction.budgetCategory,
      budgetType: transaction.budgetType,
      amount: transaction.amount.toString(),
      spreadStartMonth: spreadConfig
        ? toMonthInputValue(spreadConfig.spreadStartDate)
        : '',
      spreadEndMonth: spreadConfig
        ? toMonthInputValue(getSpreadEndDate(spreadConfig))
        : '',
    });
  }, [isOpen, transaction]);

  if (!formData || !transaction) {
    return null;
  }

  const accountOptions: DropdownOption[] = [
    ...accounts.map((account) => ({ value: account, label: account })),
    { value: '__add_new__', label: '+ Add new account', isAddNew: true },
  ];

  const budgetOptions: DropdownOption[] = [
    { value: '', label: 'Uncategorized' },
    ...budgets.map((budget) => ({
      value: String(budget.id),
      label: budget.expense_label,
      sublabel: `${budget.expense_category} • ${budget.expense_type}`,
    })),
  ];

  const handleBudgetChange = (value: string) => {
    const selectedBudget = budgets.find(
      (budget) => budget.id === parseInt(value, 10),
    );
    setFormData((prev) =>
      prev && {
        ...prev,
        budgetId: selectedBudget?.id ?? null,
        budgetLabel: selectedBudget?.expense_label ?? 'Uncategorized',
        budgetCategory: selectedBudget?.expense_category,
        budgetType: selectedBudget?.expense_type,
      },
    );
  };

  const spreadMonthCount =
    formData.spreadStartMonth && formData.spreadEndMonth
      ? getInclusiveMonthCount(formData.spreadStartMonth, formData.spreadEndMonth)
      : 0;
  const hasSpreadInput = !!(formData.spreadStartMonth || formData.spreadEndMonth);
  const fiscalYearRange = getFiscalYearMonthRange(transaction.transactionDate);

  const applyPreset = (months: number) => {
    const startMonth =
      formData.spreadStartMonth || toMonthInputValue(transaction.transactionDate);
    setFormData(
      (prev) =>
        prev && {
          ...prev,
          spreadStartMonth: startMonth,
          spreadEndMonth: addMonthsToMonthInput(startMonth, months - 1),
        },
    );
  };
  const isSpreadValid = !hasSpreadInput || spreadMonthCount >= 2;
  const canSave = !!formData.description && !!formData.amount && isSpreadValid;

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    onSave(transaction.id, {
      account: formData.account,
      transactionDate: formData.transactionDate,
      description: formData.description,
      budgetId: formData.budgetId,
      budgetLabel: formData.budgetLabel,
      budgetCategory: formData.budgetCategory,
      budgetType: formData.budgetType,
      amount: parseFloat(formData.amount),
      spreadStartDate:
        spreadMonthCount >= 2
          ? monthInputToIsoDate(formData.spreadStartMonth)
          : null,
      spreadMonths: spreadMonthCount >= 2 ? spreadMonthCount : null,
      isAccrual: spreadMonthCount >= 2,
    });
  };

  return (
    <AnchoredPopover
      isOpen={isOpen}
      anchorElement={anchorElement}
      onClose={onClose}
      align="end"
      className="edit-transaction-popover w-[min(20rem,calc(100vw-1.5rem))]"
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden">
        <div className="spread-payment-popover-header flex items-start justify-between px-5 py-4">
          <div className="spread-payment-title text-sm font-semibold">
            Edit Transaction
          </div>
          <button
            type="button"
            onClick={onClose}
            className="spread-payment-close rounded-lg p-1 transition-colors"
            aria-label="Close transaction editor"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <div>
            <label className="spread-payment-label mb-1 block text-xs font-medium">
              Account
            </label>
            <CustomDropdown
              value={formData.account}
              options={accountOptions}
              searchable
              searchPlaceholder="Search accounts..."
              onChange={(value) =>
                setFormData((prev) => prev && { ...prev, account: value })
              }
              onAddNew={(value) =>
                setFormData((prev) => prev && { ...prev, account: value })
              }
              triggerClassName="rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="spread-payment-label mb-1 block text-xs font-medium">
              Budget Item
            </label>
            <CustomDropdown
              value={formData.budgetId == null ? '' : String(formData.budgetId)}
              options={budgetOptions}
              searchable
              searchPlaceholder="Search budget items..."
              onChange={handleBudgetChange}
              triggerClassName="rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="spread-payment-label mb-1 block text-xs font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData(
                  (prev) => prev && { ...prev, description: e.target.value },
                )
              }
              className="form-input px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="spread-payment-label mb-1 block text-xs font-medium">
              Transaction Date
            </label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) =>
                setFormData(
                  (prev) =>
                    prev && { ...prev, transactionDate: e.target.value },
                )
              }
              className="form-input px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="spread-payment-label mb-1 block text-xs font-medium">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData(
                  (prev) => prev && { ...prev, amount: e.target.value },
                )
              }
              className="form-input px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="spread-payment-label block text-xs font-medium">
                Spread Payment
              </label>
              {hasSpreadInput && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData(
                      (prev) =>
                        prev && {
                          ...prev,
                          spreadStartMonth: '',
                          spreadEndMonth: '',
                        },
                    )
                  }
                  className="spread-payment-label text-xs underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="month"
                value={formData.spreadStartMonth}
                onChange={(e) =>
                  setFormData(
                    (prev) =>
                      prev && { ...prev, spreadStartMonth: e.target.value },
                  )
                }
                aria-label="Spread start month"
                className="form-input px-3 py-2 text-sm"
              />
              <input
                type="month"
                value={formData.spreadEndMonth}
                min={formData.spreadStartMonth || undefined}
                onChange={(e) =>
                  setFormData(
                    (prev) =>
                      prev && { ...prev, spreadEndMonth: e.target.value },
                  )
                }
                aria-label="Spread end month"
                className="form-input px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_MONTHS.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => applyPreset(months)}
                  className={`spread-payment-preset rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    spreadMonthCount === months
                      ? 'spread-payment-preset-active'
                      : 'spread-payment-preset-inactive'
                  }`}
                >
                  {months} months
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setFormData(
                    (prev) =>
                      prev && {
                        ...prev,
                        spreadStartMonth: fiscalYearRange.startMonth,
                        spreadEndMonth: fiscalYearRange.endMonth,
                      },
                  )
                }
                className={`spread-payment-preset rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  formData.spreadStartMonth === fiscalYearRange.startMonth &&
                  formData.spreadEndMonth === fiscalYearRange.endMonth
                    ? 'spread-payment-preset-active'
                    : 'spread-payment-preset-inactive'
                }`}
              >
                Fiscal year
              </button>
            </div>
            <div className="spread-payment-label mt-1 text-xs">
              {spreadMonthCount >= 2
                ? `${spreadMonthCount} months · ${formatCurrency(
                    (parseFloat(formData.amount) || 0) / spreadMonthCount,
                  )}/mo`
                : hasSpreadInput
                  ? 'Cover at least 2 months, or clear both to remove.'
                  : 'Leave empty for no spread.'}
            </div>
          </div>

          <div className="section-divider flex gap-3 border-t pt-4">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1 px-4 py-2 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              className="flex-1 px-4 py-2 text-xs"
              disabled={!canSave}
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </AnchoredPopover>
  );
};
