import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LuChevronDown, LuX } from 'react-icons/lu';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';

interface BulkBudgetDropdownProps {
  budgets: BudgetApiResponse[];
  onSelectBudget: (budgetId: number, label: string, category: string) => void;
  disabled?: boolean;
}

export const BulkBudgetDropdown: React.FC<BulkBudgetDropdownProps> = ({
  budgets,
  onSelectBudget,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Group and filter budgets by category based on search query
  const filteredGroupedBudgets = useMemo(() => {
    const groups = new Map<string, BudgetApiResponse[]>();
    const query = searchQuery.toLowerCase().trim();

    budgets.forEach((budget) => {
      // Skip if search query doesn't match label or category
      if (query !== '') {
        const labelMatch = budget.expense_label.toLowerCase().includes(query);
        const categoryMatch = budget.expense_category
          .toLowerCase()
          .includes(query);

        if (!labelMatch && !categoryMatch) {
          return;
        }
      }

      const category = budget.expense_category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(budget);
    });

    return groups;
  }, [budgets, searchQuery]);

  const handleSelect = (budgetId: number, label: string, category: string) => {
    onSelectBudget(budgetId, label, category);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        <span>Change Budget</span>
        <LuChevronDown size={16} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
            aria-hidden="true"
          />
          <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[250px] max-h-[400px] overflow-hidden flex flex-col">
            {/* Search Input - Sticky at top */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2 z-30">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search budgets..."
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <LuX size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="overflow-y-auto py-1">
              {filteredGroupedBudgets.size === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No budgets found matching "{searchQuery}"
                </div>
              ) : (
                Array.from(filteredGroupedBudgets.entries()).map(
                  ([category, categoryBudgets]) => (
                    <div key={category}>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                        {category}
                      </div>
                      {categoryBudgets.map((budget) => (
                        <button
                          key={budget.id}
                          onClick={() =>
                            handleSelect(
                              budget.id,
                              budget.expense_label,
                              category,
                            )
                          }
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium">
                            {budget.expense_label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {budget.expense_type}
                          </div>
                        </button>
                      ))}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
