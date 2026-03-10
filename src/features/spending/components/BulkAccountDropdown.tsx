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

  const handleSelect = (account: string) => {
    onSelectAccount(account);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
          <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
            {accounts.map((account) => (
              <button
                key={account}
                onClick={() => handleSelect(account)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
