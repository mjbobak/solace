import React from 'react';

import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

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
        <strong>{count}</strong> {count === 1 ? 'transaction' : 'transactions'}?
      </>
    }
    confirmText={isAccrual ? 'Enable Payment Spread' : 'Disable Payment Spread'}
    cancelText="Cancel"
    variant="primary"
    isLoading={isLoading}
  />
);
