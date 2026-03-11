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
  const triggerClassName =
    'inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';
  const menuClassName =
    'absolute bottom-full right-0 z-20 mb-2 max-h-[300px] min-w-[220px] overflow-y-auto rounded-2xl border border-white/10 bg-[#565761] py-2 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)]';
  const menuItemClassName =
    'w-full px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:bg-white/10';

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
