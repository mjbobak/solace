import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { BudgetView } from '@/features/budget/components/BudgetView';
import type { BudgetEntry } from '@/features/budget/types/budgetView';

const { getYearProjection, handleToggleAccrual, handleDelete, budgetEntries } =
  vi.hoisted(() => ({
    getYearProjection: vi.fn(),
    handleToggleAccrual: vi.fn(),
    handleDelete: vi.fn(),
    budgetEntries: [
      {
        id: 'BUD-0042',
        expenseType: 'ESSENTIAL',
        expenseCategory: 'HOME',
        expenseLabel: 'Groceries',
        budgeted: 600,
        spent: 275,
        remaining: 325,
        percentage: 45.8,
        isAccrual: false,
      },
    ] satisfies BudgetEntry[],
  }));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/features/income/services/incomeApiService', () => ({
  incomeApiService: {
    getYearProjection,
  },
}));

vi.mock('@/features/budget/hooks/useBudgetData', () => ({
  useBudgetData: () => ({
    budgetEntries,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    refetchSpending: vi.fn(),
    upsertBudgetEntry: vi.fn(),
    removeBudgetEntry: vi.fn(),
    monthlyRange: null,
    spendBasisLabel: 'Total for completed months',
    spendBasisHelpText: 'Using Jan-Feb 2026 actuals',
  }),
}));

vi.mock('@/features/budget/hooks/useBudgetFiltering', () => ({
  useBudgetFiltering: (entries: BudgetEntry[]) => entries,
}));

vi.mock('@/features/budget/hooks/useBudgetCalculations', () => ({
  useBudgetCalculations: () => ({
    budgeted: 600,
    spent: 275,
    remaining: 325,
    percentage: 45.8,
  }),
}));

vi.mock('@/features/budget/hooks/useBudgetOperations', () => ({
  useBudgetOperations: () => ({
    handleSave: vi.fn(),
    handleUpdate: vi.fn(),
    handleDelete,
    handleToggleAccrual,
  }),
}));

vi.mock('@/features/budget/hooks/useCustomOptions', () => ({
  useCustomOptions: () => ({
    categories: [{ name: 'HOME' }],
    getAllExpenseTypeOptions: () => ['ESSENTIAL', 'FUNSIES'],
    addCategory: vi.fn(),
  }),
}));

vi.mock('@/features/budget/components/BudgetSummary', () => ({
  BudgetSummary: () => <div>Budget Summary</div>,
}));

vi.mock('@/features/budget/components/BudgetItemModal', () => ({
  BudgetItemModal: () => null,
}));

vi.mock('@/shared/components/ConfirmDialog', () => ({
  ConfirmDialog: () => null,
}));

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderBudgetView(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/budget"
          element={
            <BudgetView planningYear={2026} spendBasis="annual_full_year" />
          }
        />
        <Route path="/spending" element={<div>Spending Destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BudgetView drill-through', () => {
  beforeEach(() => {
    getYearProjection.mockResolvedValue({
      totals: { plannedNet: 120000 },
    });
    handleToggleAccrual.mockClear();
    handleDelete.mockClear();
  });

  it('navigates from the spent cell to spending with drill-through filters', async () => {
    renderBudgetView(
      '/budget?planningYear=2026&spendBasis=annual_full_year&type=ALL&category=HOME&account=Checking&q=old&page=3',
    );

    const viewTransactionsButton = await screen.findByRole('button', {
      name: 'View transactions for Groceries',
    });

    fireEvent.click(viewTransactionsButton);

    await waitFor(() =>
      expect(screen.getByText('Spending Destination')).toBeInTheDocument(),
    );

    const [pathname, search = ''] =
      screen.getByTestId('location').textContent?.split('?') ?? [];
    const params = new URLSearchParams(search);

    expect(pathname).toBe('/spending');
    expect(params.get('planningYear')).toBe('2026');
    expect(params.get('spendBasis')).toBe('annual_full_year');
    expect(params.get('budgetId')).toBe('42');
    expect(params.getAll('year')).toEqual(['2026']);
    expect(params.getAll('month')).toEqual([]);
    expect(params.getAll('category')).toEqual(['HOME']);
    expect(params.get('type')).toBe('ALL');
    expect(params.get('account')).toBeNull();
    expect(params.get('q')).toBeNull();
    expect(params.get('page')).toBeNull();
  });

  it('does not navigate when reserve, edit, or delete controls are clicked', async () => {
    renderBudgetView(
      '/budget?planningYear=2026&spendBasis=annual_full_year&type=ALL&category=HOME',
    );

    await screen.findByRole('button', {
      name: 'View transactions for Groceries',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reserve Monthly' }));
    expect(handleToggleAccrual).toHaveBeenCalledWith('BUD-0042');
    expect(screen.getByTestId('location')).toHaveTextContent('/budget');

    fireEvent.click(screen.getByRole('button', { name: 'Edit Groceries' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/budget');

    fireEvent.click(screen.getByRole('button', { name: 'Delete Groceries' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/budget');
    expect(screen.queryByText('Spending Destination')).not.toBeInTheDocument();
  });
});
