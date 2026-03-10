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
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50/60 rounded-full text-xs font-medium text-blue-700 border border-blue-200/50 whitespace-nowrap ${className}`}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="p-0.5 hover:bg-blue-200/50 rounded transition-colors flex-shrink-0"
        title="Remove filter"
        aria-label={`Remove ${label} filter`}
      >
        <LuX size={12} />
      </button>
    </div>
  );
};
