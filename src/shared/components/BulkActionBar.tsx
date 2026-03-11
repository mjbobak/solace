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

  const toolbarControlClassName =
    'h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';
  const pendingChipClassName =
    'inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white';
  const iconButtonClassName =
    'inline-flex h-5 w-5 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white';
  const secondaryActionClassName = `${toolbarControlClassName} justify-center gap-2`;

  return createPortal(
    <div className="fixed bottom-6 left-6 right-6 z-50 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-[#565761]/95 px-4 py-4 shadow-[0_16px_30px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onClearSelection}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/90 transition-all duration-200 hover:bg-white/10 hover:text-white"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <LuX size={18} />
          </button>

          <div className="flex h-11 items-center gap-3 border-r border-white/20 pr-5 text-sm font-semibold text-white">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/12 px-2 text-xs text-white">
              {selectedCount}
            </span>
            <span>work items selected</span>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {children}
            {actions.map((action) => (
              <Button
                key={action.key}
                variant={action.variant || 'secondary'}
                onClick={action.onClick}
                className={`${toolbarControlClassName} shrink-0 rounded-xl px-4 py-0 text-sm`}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </Button>
            ))}
          </div>

          {pendingOperations.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {pendingOperations.map((op) => (
                <div
                  key={op.type}
                  className={pendingChipClassName}
                >
                  <span className="whitespace-nowrap">{op.label}</span>
                  <button
                    onClick={op.onClear}
                    className={iconButtonClassName}
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
                className={secondaryActionClassName}
                title="Delete selected items"
                aria-label="Delete selected items"
              >
                <LuTrash2 size={16} />
                <span>Delete</span>
              </button>
            )}

            {onSave && (
              <Button
                variant="primary"
                onClick={onSave}
                disabled={saveDisabled || pendingOperations.length === 0}
                className="h-11 shrink-0 rounded-xl bg-white px-5 py-0 text-sm text-[#4d5cff] shadow-none hover:bg-white/90 disabled:bg-white/20 disabled:text-white/50"
              >
                Save changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
