import type { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';

import type { ProjectedIncomeSource } from '../types/income';
import type { ActionMenuPosition } from '../types/incomeView';

interface IncomeSourceActionMenuProps {
  source: ProjectedIncomeSource | null;
  actionMenuPosition: ActionMenuPosition | null;
  actionMenuRef: RefObject<HTMLDivElement | null>;
  onRename: (source: ProjectedIncomeSource) => void;
  onAddBonus: (source: ProjectedIncomeSource) => void;
  onDelete: (source: ProjectedIncomeSource) => void;
  onClose: () => void;
}

export function IncomeSourceActionMenu({
  source,
  actionMenuPosition,
  actionMenuRef,
  onRename,
  onAddBonus,
  onDelete,
  onClose,
}: IncomeSourceActionMenuProps) {
  if (!source || !actionMenuPosition) {
    return null;
  }

  return createPortal(
    <div
      ref={actionMenuRef}
      className="fixed z-[70] min-w-[180px] overflow-hidden rounded-xl border border-app bg-white shadow-lg"
      style={{
        top: actionMenuPosition.top,
        left: actionMenuPosition.left,
        transform: 'translateX(calc(-100% + 2.5rem))',
      }}
      role="menu"
      aria-label={`Actions for ${source.name}`}
    >
      <button
        type="button"
        className="menu-action-item menu-action-item-edit"
        onClick={() => {
          onClose();
          onRename(source);
        }}
        role="menuitem"
      >
        <LuPencil className="h-4 w-4" />
        Rename
      </button>
      <button
        type="button"
        className="menu-action-item menu-action-item-primary"
        onClick={() => {
          onClose();
          onAddBonus(source);
        }}
        role="menuitem"
      >
        <LuPlus className="h-4 w-4" />
        Add Event
      </button>
      <button
        type="button"
        className="menu-action-item menu-action-item-delete"
        onClick={() => {
          onClose();
          onDelete(source);
        }}
        role="menuitem"
      >
        <LuTrash2 className="h-4 w-4" />
        Delete
      </button>
    </div>,
    document.body,
  );
}
