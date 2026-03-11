import React, { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';

interface BulkAccountDropdownProps {
  accounts: string[];
  onSelectAccount: (account: string) => void;
  disabled?: boolean;
}

export const BulkAccountDropdown: React.FC<BulkAccountDropdownProps> = ({
  accounts,
  onSelectAccount,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerClassName = 'bulk-toolbar-control inline-flex h-11 gap-2 px-4';
  const menuClassName =
    'bulk-toolbar-menu absolute bottom-full right-0 z-20 mb-2 max-h-[300px] min-w-[220px] overflow-y-auto py-2';
  const menuItemClassName = 'bulk-toolbar-menu-item font-medium';

  const handleSelect = (account: string) => {
    onSelectAccount(account);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={triggerClassName}
      >
        <span>Change Account</span>
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
            {accounts.map((account) => (
              <button
                key={account}
                onClick={() => handleSelect(account)}
                className={menuItemClassName}
              >
                {account}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
