import React, { useState } from 'react';
import { BiRepeat } from 'react-icons/bi';
import { budgetModalTheme } from '@/shared/theme';

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
      className={`${budgetModalTheme.toggleButton} disabled:opacity-50 ${
        isActive
          ? `${budgetModalTheme.toggleButtonActive} ${budgetModalTheme.reserveToggleActive}`
          : budgetModalTheme.toggleButtonInactive
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
