import React, { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';

export type BulkSpreadOption = 'fiscalYear' | 'remove';

interface BulkSpreadDropdownProps {
  onSelectSpread: (option: BulkSpreadOption) => void;
  disabled?: boolean;
}

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
        className="bulk-toolbar-control h-9"
      >
        <span>Payment Spread</span>
        <LuChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="bulk-toolbar-menu absolute top-full left-0 z-20 mt-2 min-w-[260px] overflow-hidden py-2">
            <button
              onClick={() => handleSelect('fiscalYear')}
              className="bulk-toolbar-menu-item flex flex-col items-start gap-1 text-left"
            >
              <span className="font-medium">12 months fiscal year</span>
              <span className="bulk-toolbar-muted text-xs">
                Spread each transaction across Jan-Dec of its own year
              </span>
            </button>
            <button
              onClick={() => handleSelect('remove')}
              className="bulk-toolbar-menu-item flex flex-col items-start gap-1 text-left"
            >
              <span className="font-medium">Remove spread</span>
              <span className="bulk-toolbar-muted text-xs">
                Clear payment spread details for the selected transactions
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
