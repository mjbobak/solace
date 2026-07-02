import React, { useEffect, useState } from 'react';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import {
  addMonthsToMonthInput,
  getFiscalYearMonthRange,
  getInclusiveMonthCount,
  monthInputToIsoDate,
  toMonthInputValue,
} from '@/features/spending/utils/spreadPayments';
import { Button } from '@/shared/components/Button';
import { CustomDropdown } from '@/shared/components/CustomDropdown';
import type { DropdownOption } from '@/shared/components/CustomDropdown';
import { Modal } from '@/shared/components/Modal';
import { formatCurrency } from '@/shared/utils/currency';
import { getTodayDateOnly } from '@/shared/utils/dateOnly';

import type { SpendingEntry } from '../types/spendingView';

import { CsvUploadModal } from './CsvUploadModal';

const PRESET_MONTHS = [3, 6, 12] as const;

type TabType = 'manual' | 'upload';

interface AddTransactionModalProps {
  isOpen: boolean;
  budgets: BudgetApiResponse[];
  accounts: string[];
  onClose: () => void;
  onAddEntry: (entry: Omit<SpendingEntry, 'id'>) => void;
}

interface TransactionFormData {
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

function createDefaultFormData(accounts: string[]): TransactionFormData {
  return {
    account: accounts[0] ?? '',
    transactionDate: getTodayDateOnly(),
    description: '',
    budgetId: null,
    budgetLabel: 'Uncategorized',
    budgetCategory: undefined,
    budgetType: undefined,
    amount: '',
    spreadStartMonth: '',
    spreadEndMonth: '',
  };
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  budgets,
  accounts,
  onClose,
  onAddEntry,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [formData, setFormData] = useState(() =>
    createDefaultFormData(accounts),
  );

  // Reset form each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(createDefaultFormData(accounts));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    setFormData(createDefaultFormData(accounts));
    setActiveTab('manual');
    setIsPreviewing(false);
    onClose();
  };

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
    setFormData((prev) => ({
      ...prev,
      budgetId: selectedBudget?.id ?? null,
      budgetLabel: selectedBudget?.expense_label ?? 'Uncategorized',
      budgetCategory: selectedBudget?.expense_category,
      budgetType: selectedBudget?.expense_type,
    }));
  };

  const spreadMonthCount =
    formData.spreadStartMonth && formData.spreadEndMonth
      ? getInclusiveMonthCount(formData.spreadStartMonth, formData.spreadEndMonth)
      : 0;
  const hasSpreadInput = !!(formData.spreadStartMonth || formData.spreadEndMonth);
  const fiscalYearRange = getFiscalYearMonthRange(formData.transactionDate);

  const applyPreset = (months: number) => {
    const startMonth =
      formData.spreadStartMonth || toMonthInputValue(formData.transactionDate);
    setFormData((prev) => ({
      ...prev,
      spreadStartMonth: startMonth,
      spreadEndMonth: addMonthsToMonthInput(startMonth, months - 1),
    }));
  };
  const isSpreadValid = !hasSpreadInput || spreadMonthCount >= 2;
  const canSubmit =
    !!formData.description && !!formData.amount && isSpreadValid;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onAddEntry({
      account: formData.account,
      transactionDate: formData.transactionDate,
      postDate: formData.transactionDate,
      description: formData.description,
      budgetLabel: formData.budgetLabel,
      budgetId: formData.budgetId,
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

    handleClose();
  };

  const isUploadMode = activeTab === 'upload';
  const isWide = isUploadMode && isPreviewing;
  const modalTitle = isUploadMode ? 'Import Spending Data' : 'Add Transaction';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth={isWide ? 'full' : 'md'}
      panelClassName={isWide ? 'w-[min(96vw,1800px)]' : ''}
      contentClassName={isUploadMode ? 'px-4 py-5 sm:px-5 sm:py-6' : ''}
    >
      {/* Tab Navigation */}
      <div className="form-tabs-row">
        <button
          onClick={() => setActiveTab('manual')}
          className={`form-tab ${
            activeTab === 'manual' ? 'form-tab-active' : 'form-tab-inactive'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`form-tab ${
            activeTab === 'upload' ? 'form-tab-active' : 'form-tab-inactive'
          }`}
        >
          Upload File
        </button>
      </div>

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-3">
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
                setFormData((prev) => ({ ...prev, account: value }))
              }
              onAddNew={(value) =>
                setFormData((prev) => ({ ...prev, account: value }))
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
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="e.g., Whole Foods Market"
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
                setFormData((prev) => ({
                  ...prev,
                  transactionDate: e.target.value,
                }))
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
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
              placeholder="0.00"
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
                    setFormData((prev) => ({
                      ...prev,
                      spreadStartMonth: '',
                      spreadEndMonth: '',
                    }))
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
                  setFormData((prev) => ({
                    ...prev,
                    spreadStartMonth: e.target.value,
                  }))
                }
                aria-label="Spread start month"
                className="form-input px-3 py-2 text-sm"
              />
              <input
                type="month"
                value={formData.spreadEndMonth}
                min={formData.spreadStartMonth || undefined}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    spreadEndMonth: e.target.value,
                  }))
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
                  setFormData((prev) => ({
                    ...prev,
                    spreadStartMonth: fiscalYearRange.startMonth,
                    spreadEndMonth: fiscalYearRange.endMonth,
                  }))
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
            <Button onClick={handleClose} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="primary"
              className="flex-1"
              disabled={!canSubmit}
            >
              Add Transaction
            </Button>
          </div>
        </div>
      )}

      {/* Upload File Tab */}
      {activeTab === 'upload' && (
        <CsvUploadModal
          budgets={budgets}
          onPreviewStateChange={setIsPreviewing}
          onCancel={handleClose}
          onSuccess={() => {
            handleClose();
          }}
        />
      )}
    </Modal>
  );
};
