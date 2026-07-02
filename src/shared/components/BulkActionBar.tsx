import React from 'react';
import { LuTrash2, LuX } from 'react-icons/lu';

import { Button } from '@/shared/components/Button';

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

interface BulkActionBarProps {
  selectedCount: number;
  itemLabel?: string;
  onClearSelection: () => void;
  actions: BulkAction[];
  children?: React.ReactNode;
  pendingOperations?: Array<{
    type: string;
    label: string;
    onClear: () => void;
  }>;
  onSave?: () => void;
  saveDisabled?: boolean;
  onDelete?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  itemLabel = 'items',
  onClearSelection,
  actions,
  children,
  pendingOperations = [],
  onSave,
  saveDisabled = false,
  onDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-toolbar">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onClearSelection}
            className="bulk-toolbar-close"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <LuX size={16} />
          </button>

          <div className="bulk-toolbar-count">
            <span className="bulk-toolbar-count-badge">{selectedCount}</span>
            <span>{itemLabel} selected</span>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {children}
            {actions.map((action) => (
              <Button
                key={action.key}
                variant={action.variant || 'secondary'}
                onClick={action.onClick}
                className="bulk-toolbar-control h-9 shrink-0 px-3 py-0"
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>

          {pendingOperations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {pendingOperations.map((op) => (
                <div key={op.type} className="bulk-toolbar-chip h-8">
                  <span className="whitespace-nowrap">{op.label}</span>
                  <button
                    onClick={op.onClear}
                    className="bulk-toolbar-icon-button"
                    title={`Clear ${op.type}`}
                  >
                    <LuX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {onDelete && (
              <button
                onClick={onDelete}
                className="bulk-toolbar-delete"
                title="Delete selected items"
                aria-label="Delete selected items"
              >
                <LuTrash2 size={16} className="shrink-0" />
                <span>Delete</span>
              </button>
            )}

            {onSave && (
              <Button
                variant="primary"
                onClick={onSave}
                disabled={saveDisabled || pendingOperations.length === 0}
                className="bulk-toolbar-primary h-9 shrink-0 py-0"
              >
                Save changes
              </Button>
            )}
          </div>
        </div>
    </div>
  );
};
