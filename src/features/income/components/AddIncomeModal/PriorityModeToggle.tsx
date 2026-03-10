/**
 * Toggle for gross/net priority mode
 */

import React from 'react';

type PriorityMode = 'gross' | 'net';

interface PriorityModeToggleProps {
  value: PriorityMode;
  onChange: (mode: PriorityMode) => void;
}

export const PriorityModeToggle: React.FC<PriorityModeToggleProps> = ({
  value,
  onChange,
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-2">
      Entry Priority
    </label>
    <div className="flex gap-3">
      <PriorityButton
        label="Gross is Primary"
        isActive={value === 'gross'}
        onClick={() => onChange('gross')}
      />
      <PriorityButton
        label="Net is Primary"
        isActive={value === 'net'}
        onClick={() => onChange('net')}
      />
    </div>
    <p className="text-xs text-gray-500 mt-2">
      {value === 'gross'
        ? 'Gross amount is the source of truth. Net will be calculated from gross - deductions.'
        : 'Net amount is the source of truth. Ensure gross - deductions matches your net.'}
    </p>
  </div>
);

const PriorityButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
      isActive
        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);
