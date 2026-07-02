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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredGroupedBudgets = useMemo(() => {
    const groups = new Map<string, BudgetApiResponse[]>();
    const query = searchQuery.toLowerCase().trim();

    budgets.forEach((budget) => {
      if (query !== '') {
        const labelMatch = budget.expense_label.toLowerCase().includes(query);
        const categoryMatch = budget.expense_category
          .toLowerCase()
          .includes(query);
        if (!labelMatch && !categoryMatch) return;
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
        className="bulk-toolbar-control h-9"
      >
        <span>Change Budget</span>
        <LuChevronDown size={14} />
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
          <div className="bulk-toolbar-menu absolute top-full left-0 z-20 mt-2 flex max-h-[400px] min-w-[280px] flex-col overflow-hidden">
            <div className="bulk-toolbar-search-header">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search budgets..."
                  className="bulk-toolbar-input pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="bulk-toolbar-search-clear"
                    aria-label="Clear search"
                  >
                    <LuX size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto py-2">
              {filteredGroupedBudgets.size === 0 ? (
                <div className="bulk-toolbar-empty">
                  No budgets found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                Array.from(filteredGroupedBudgets.entries()).map(
                  ([category, categoryBudgets]) => (
                    <div key={category}>
                      <div className="bulk-toolbar-category-header">
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
                          className="bulk-toolbar-menu-item"
                        >
                          <div className="font-medium">
                            {budget.expense_label}
                          </div>
                          <div className="bulk-toolbar-muted text-xs">
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
