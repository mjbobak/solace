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
  const triggerClassName =
    'inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';
  const menuClassName =
    'absolute bottom-full right-0 z-20 mb-2 flex max-h-[400px] min-w-[280px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#565761] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)]';
  const menuItemClassName =
    'w-full px-4 py-3 text-left text-sm text-white transition-colors hover:bg-white/10';

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
        className={triggerClassName}
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
          <div className={menuClassName}>
            {/* Search Input - Sticky at top */}
            <div className="sticky top-0 z-30 border-b border-white/10 bg-[#565761] p-3">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search budgets..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-8 text-sm text-white placeholder:text-white/45 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                  >
                    <LuX size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="overflow-y-auto py-2">
              {filteredGroupedBudgets.size === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-white/60">
                  No budgets found matching "{searchQuery}"
                </div>
              ) : (
                Array.from(filteredGroupedBudgets.entries()).map(
                  ([category, categoryBudgets]) => (
                    <div key={category}>
                      <div className="sticky top-0 bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/55">
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
                          className={menuItemClassName}
                        >
                          <div className="font-medium">
                            {budget.expense_label}
                          </div>
                          <div className="text-xs text-white/55">
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
