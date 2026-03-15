import React, { useState } from 'react';
import { BiRepeat } from 'react-icons/bi';

interface AccrualToggleButtonProps {
  onToggle: (isAccrual: boolean) => void;
  disabled?: boolean;
}

export const AccrualToggleButton: React.FC<AccrualToggleButtonProps> = ({
  onToggle,
  disabled = false,
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    const newState = !isActive;
    setIsActive(newState);
    onToggle(newState);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 ring-1 ring-purple-300 disabled:opacity-50'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
      }`}
      title={
        isActive
          ? 'Disable payment spread for selected transactions'
          : 'Enable payment spread for selected transactions'
      }
    >
      <BiRepeat size={16} />
      <span>{isActive ? 'Payment Spread' : 'Spread Payment'}</span>
    </button>
  );
};
