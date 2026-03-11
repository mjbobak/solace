import React from 'react';
import { LuX } from 'react-icons/lu';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  onRemove,
  className = '',
}) => {
  return (
    <div className={`status-chip status-chip-brand rounded-full whitespace-nowrap ${className}`}>
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="filter-chip-dismiss flex-shrink-0 rounded p-0.5 transition-colors"
        title="Remove filter"
        aria-label={`Remove ${label} filter`}
      >
        <LuX size={12} />
      </button>
    </div>
  );
};
