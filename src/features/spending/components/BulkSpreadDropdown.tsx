import React, { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';

export type BulkSpreadOption = 'fiscalYear' | 'remove';

interface BulkSpreadDropdownProps {
  onSelectSpread: (option: BulkSpreadOption) => void;
  disabled?: boolean;
}

const triggerClassName = 'bulk-toolbar-control inline-flex h-11 gap-2 px-4';
const menuClassName =
  'bulk-toolbar-menu absolute bottom-full right-0 z-20 mb-2 min-w-[260px] overflow-hidden py-2';
const menuItemClassName =
  'bulk-toolbar-menu-item flex flex-col items-start gap-1 text-left';

export const BulkSpreadDropdown: React.FC<BulkSpreadDropdownProps> = ({
  onSelectSpread,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: BulkSpreadOption) => {
    onSelectSpread(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={triggerClassName}
      >
        <span>Payment Spread</span>
        <LuChevronDown size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className={menuClassName}>
            <button
              onClick={() => handleSelect('fiscalYear')}
              className={menuItemClassName}
            >
              <span className="font-medium">12 months fiscal year</span>
              <span className="text-xs text-white/55">
                Spread each transaction across Jan-Dec of its own year
              </span>
            </button>
            <button
              onClick={() => handleSelect('remove')}
              className={menuItemClassName}
            >
              <span className="font-medium">Remove spread</span>
              <span className="text-xs text-white/55">
                Clear payment spread details for the selected transactions
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
