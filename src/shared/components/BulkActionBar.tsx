import React from 'react';
import { createPortal } from 'react-dom';
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
  onClearSelection,
  actions,
  children,
  pendingOperations = [],
  onSave,
  saveDisabled = false,
  onDelete,
}) => {
  if (selectedCount === 0) return null;

  return createPortal(
    <div className="fixed bottom-6 left-6 right-6 z-50 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.24)] px-6 py-3 max-w-7xl mx-auto">
      {/* Main row: Selection count, controls, and Save button */}
      <div className="flex items-center gap-3">
        {/* Selection badge with clear button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onClearSelection}
            className="p-1.5 hover:bg-gray-200/50 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <LuX size={18} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/60 rounded-lg text-xs font-semibold text-blue-700">
            <span>{selectedCount}</span>
            <span className="text-gray-500">selected</span>
          </div>
        </div>

        {/* Action controls (dropdowns, buttons) */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {children}
          {actions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
              className="text-xs px-3 py-1.5 shrink-0"
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Pending operations inline display */}
        {pendingOperations.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-gray-200/50">
            {pendingOperations.map((op) => (
              <div
                key={op.type}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50/60 rounded-lg text-xs font-medium text-amber-700 border border-amber-200/50"
              >
                <span className="whitespace-nowrap">{op.label}</span>
                <button
                  onClick={op.onClear}
                  className="p-0.5 hover:bg-amber-200/50 rounded transition-colors flex-shrink-0"
                  title={`Clear ${op.type}`}
                >
                  <LuX size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors shrink-0"
            title="Delete selected items"
            aria-label="Delete selected items"
          >
            <LuTrash2 size={18} />
          </button>
        )}

        {/* Save button */}
        {onSave && (
          <Button
            variant="primary"
            onClick={onSave}
            disabled={saveDisabled || pendingOperations.length === 0}
            className="ml-auto shrink-0 text-xs px-3 py-1.5"
          >
            Save
          </Button>
        )}
      </div>
    </div>,
    document.body,
  );
};
