import React, { useState, useEffect } from 'react';

import { budgetService } from '@/features/budget/services/budgetService';
import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { formatCurrency } from '@/shared/utils/currency';
import { getTodayDateOnly } from '@/shared/utils/dateOnly';

import type { SpendingEntry } from '../types/spendingView';
import {
  formatSpreadRangeLabel,
  getSpreadPaymentConfig,
} from '../utils/spreadPayments';

import { CsvUploadModal } from './CsvUploadModal';

const ACCOUNTS = [
  'Discover',
  'Chase Checking',
  'Wells Fargo',
  'Capital One',
  'Bank of America',
];

type TabType = 'manual' | 'upload';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntry: (entry: Omit<SpendingEntry, 'id'>) => void;
  onUpdateEntry?: (id: string, updates: Partial<SpendingEntry>) => void;
  item?: SpendingEntry;
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
}

function createDefaultFormData(): TransactionFormData {
  const today = getTodayDateOnly();

  return {
    account: ACCOUNTS[0],
    transactionDate: today,
    description: '',
    budgetId: null,
    budgetLabel: 'Uncategorized',
    budgetCategory: undefined,
    budgetType: undefined,
    amount: '',
  };
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddEntry,
  onUpdateEntry,
  item,
}) => {
  const isEditMode = !!item;
  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [budgets, setBudgets] = useState<BudgetApiResponse[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [formData, setFormData] = useState(createDefaultFormData);

  // Fetch budgets on mount
  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const data = await budgetService.getAllBudgets();
        setBudgets(data);
      } catch (error) {
        console.error('Failed to load budgets:', error);
      } finally {
        setIsLoadingBudgets(false);
      }
    };
    fetchBudgets();
  }, []);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        account: item.account,
        transactionDate: item.transactionDate,
        description: item.description,
        budgetId: item.budgetId ?? null,
        budgetLabel: item.budgetLabel,
        budgetCategory: item.budgetCategory,
        budgetType: item.budgetType,
        amount: item.amount.toString(),
      });
    } else if (isOpen) {
      // Reset form for add mode
      setFormData(createDefaultFormData());
    }
  }, [isOpen, isEditMode, item]);

  const handleClose = () => {
    setFormData(createDefaultFormData());
    setActiveTab('manual');
    onClose();
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      return;
    }

    const baseEntry = {
      account: formData.account,
      transactionDate: formData.transactionDate,
      description: formData.description,
      budgetLabel: formData.budgetLabel,
      budgetId: formData.budgetId,
      budgetCategory: formData.budgetCategory,
      budgetType: formData.budgetType,
      amount: parseFloat(formData.amount),
    };

    if (isEditMode && item) {
      onUpdateEntry?.(item.id, baseEntry);
    } else {
      onAddEntry({
        ...baseEntry,
        postDate: formData.transactionDate,
      });
    }

    handleClose();
  };

  const inputBaseClass = 'form-input';
  const labelClass = 'form-label';

  const amount = parseFloat(formData.amount) || 0;
  const isUploadMode = !isEditMode && activeTab === 'upload';
  const modalTitle = isEditMode
    ? 'Edit Transaction'
    : isUploadMode
      ? 'Import Spending Data'
      : 'Add Transaction';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      maxWidth={isUploadMode ? 'full' : '3xl'}
      panelClassName={isUploadMode ? 'w-[min(96vw,1800px)]' : ''}
      contentClassName={isUploadMode ? 'px-4 py-5 sm:px-5 sm:py-6' : ''}
    >
      {/* Tab Navigation - Only show for add mode */}
      {!isEditMode && (
        <div className="form-tabs-row">
          <button
            onClick={() => setActiveTab('manual')}
            className={`form-tab ${
              activeTab === 'manual'
                ? 'form-tab-active'
                : 'form-tab-inactive'
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`form-tab ${
              activeTab === 'upload'
                ? 'form-tab-active'
                : 'form-tab-inactive'
            }`}
          >
            Upload File
          </button>
        </div>
      )}

      {/* Manual Entry Tab - Show in both add and edit modes */}
      {(activeTab === 'manual' || isEditMode) && (
        <div className="space-y-6">
          {/* Account and Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Account</label>
              <select
                value={formData.account}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, account: e.target.value }))
                }
                className={`${inputBaseClass} rounded-full px-4 py-3 text-base`}
              >
                {ACCOUNTS.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Budget Item</label>
              <select
                value={formData.budgetId ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setFormData((prev) => ({
                      ...prev,
                      budgetId: null,
                      budgetLabel: 'Uncategorized',
                      budgetCategory: undefined,
                      budgetType: undefined,
                    }));
                  } else {
                    const selectedBudget = budgets.find(
                      (b) => b.id === parseInt(value, 10),
                    );
                    if (selectedBudget) {
                      setFormData((prev) => ({
                        ...prev,
                        budgetId: selectedBudget.id,
                        budgetLabel: selectedBudget.expense_label,
                        budgetCategory: selectedBudget.expense_category,
                        budgetType: selectedBudget.expense_type,
                      }));
                    }
                  }
                }}
                disabled={isLoadingBudgets}
                className={`${inputBaseClass} rounded-full px-4 py-3 text-base`}
              >
                <option value="">
                  {isLoadingBudgets
                    ? 'Loading budgets...'
                    : 'Select budget item (or leave uncategorized)'}
                </option>

                {/* Group budgets by category */}
                {Array.from(
                  budgets.reduce((acc, budget) => {
                    const category = budget.expense_category;
                    if (!acc.has(category)) {
                      acc.set(category, []);
                    }
                    acc.get(category)!.push(budget);
                    return acc;
                  }, new Map<string, BudgetApiResponse[]>()),
                ).map(([category, categoryBudgets]) => (
                  <optgroup key={category} label={category}>
                    {categoryBudgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.expense_label} ({budget.expense_type})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="e.g., Whole Foods Market"
              className={`${inputBaseClass} px-4 py-3 text-base`}
            />
          </div>

          {/* Dates and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Transaction Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    transactionDate: e.target.value,
                  }))
                }
                className={`${inputBaseClass} px-4 py-3 text-base`}
              />
            </div>

            <div>
              <label className={labelClass}>
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
                className={`${inputBaseClass} px-4 py-3 text-base`}
              />
            </div>
          </div>

          <div className="form-callout">
            {item && getSpreadPaymentConfig(item) ? (
              <>
                Spread payment is configured for{' '}
                <span className="form-callout-emphasis font-semibold">
                  {formatSpreadRangeLabel(getSpreadPaymentConfig(item)!)}
                </span>
                . Edit it from the table&apos;s Spread Payment column.
              </>
            ) : (
              "Spread payment is managed from the table's Spread Payment column after you save the transaction."
            )}
          </div>

          {/* Amount Preview */}
          {amount > 0 && (
            <div className="form-preview">
              <div className="flex justify-between items-center">
                <span className="form-preview-label">Amount:</span>
                <span className="form-preview-value">{formatCurrency(amount)}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="section-divider flex gap-3 border-t pt-4">
            <Button
              onClick={handleClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="primary"
              className="flex-1"
              disabled={!formData.description || !formData.amount}
            >
              {isEditMode ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </div>
        </div>
      )}

      {/* Upload File Tab */}
      {activeTab === 'upload' && (
        <CsvUploadModal
          budgets={budgets}
          isLoadingBudgets={isLoadingBudgets}
          onSuccess={() => {
            handleClose();
          }}
        />
      )}
    </Modal>
  );
};
