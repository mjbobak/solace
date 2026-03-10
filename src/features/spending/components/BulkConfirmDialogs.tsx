import React from 'react';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

interface BulkSaveConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  operations: Array<{
    type: 'delete' | 'category' | 'account' | 'spread';
    value?: string | { id: number; label: string; category: string };
  }>;
  isLoading?: boolean;
}

type BulkOperationValue = string | { id: number; label: string; category: string };

function getOperationValueLabel(value?: BulkOperationValue): string | boolean | undefined {
  if (typeof value === 'object' && value !== null) {
    return value.label;
  }

  return value;
}

export const BulkSaveConfirm: React.FC<BulkSaveConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  operations,
  isLoading,
}) => {
  const getOperationLabel = (op: {
    type: string;
    value?: BulkOperationValue;
  }) => {
    const displayValue = getOperationValueLabel(op.value);

    switch (op.type) {
      case 'delete':
        return 'Delete transactions';
      case 'category':
        return `Change budget item to "${displayValue}"`;
      case 'account':
        return `Change account to "${displayValue}"`;
      case 'spread':
        return 'Remove payment spread';
      default:
        return '';
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Bulk Changes"
      message={
        <>
          Apply the following changes to <strong>{count}</strong>{' '}
          {count === 1 ? 'transaction' : 'transactions'}?
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            {operations.map((op, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-600">•</span>
                <span>{getOperationLabel(op)}</span>
              </li>
            ))}
          </ul>
        </>
      }
      confirmText="Apply Changes"
      cancelText="Cancel"
      variant={
        operations.some((op) => op.type === 'delete') ? 'danger' : 'primary'
      }
      isLoading={isLoading}
    />
  );
};

interface BulkDeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  isLoading?: boolean;
}

export const BulkDeleteConfirm: React.FC<BulkDeleteConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  isLoading,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Delete Multiple Transactions"
    message={
      <>
        Are you sure you want to delete <strong>{count}</strong>{' '}
        {count === 1 ? 'transaction' : 'transactions'}? This action cannot be
        undone.
      </>
    }
    confirmText={`Delete ${count} ${
      count === 1 ? 'Transaction' : 'Transactions'
    }`}
    cancelText="Cancel"
    variant="danger"
    isLoading={isLoading}
  />
);

interface BulkCategoryConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  category: string;
  isLoading?: boolean;
}

export const BulkCategoryConfirm: React.FC<BulkCategoryConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  category,
  isLoading,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Update Budget Item"
    message={
      <>
        Change budget item to <strong>{category}</strong> for{' '}
        <strong>{count}</strong> {count === 1 ? 'transaction' : 'transactions'}?
      </>
    }
    confirmText="Update Budget Item"
    cancelText="Cancel"
    variant="primary"
    isLoading={isLoading}
  />
);

interface BulkAccrualConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  isAccrual: boolean;
  isLoading?: boolean;
}

export const BulkAccrualConfirm: React.FC<BulkAccrualConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  isAccrual,
  isLoading,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Update Payment Spread"
    message={
      <>
        {isAccrual ? 'Enable' : 'Disable'} payment spread for{' '}
        <strong>{count}</strong> {count === 1 ? 'transaction' : 'transactions'}
        ?
      </>
    }
    confirmText={isAccrual ? 'Enable Payment Spread' : 'Disable Payment Spread'}
    cancelText="Cancel"
    variant="primary"
    isLoading={isLoading}
  />
);
