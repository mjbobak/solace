import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PlanningShellPage from '@/features/planning-shell';
import { ThemeProvider } from '@/shared/theme';

const {
  mockSetPlanningFilters,
  mockSetPlanningYear,
  mockSetSpendBasis,
} = vi.hoisted(() => ({
  mockSetPlanningFilters: vi.fn(),
  mockSetPlanningYear: vi.fn(),
  mockSetSpendBasis: vi.fn(),
}));

vi.mock('@/shared/hooks/useSharedPlanningFilters', () => ({
  useSharedPlanningFilters: () => ({
    availableYears: [2025, 2026],
    isLoading: false,
    planningYear: 2026,
    spendBasis: 'annual_full_year',
    setPlanningYear: mockSetPlanningYear,
    setPlanningFilters: mockSetPlanningFilters,
    setSpendBasis: mockSetSpendBasis,
  }),
}));

vi.mock('@/features/dashboard-infographic', () => ({
  DashboardInfographic: ({
    year,
    spendBasis,
    mode,
  }: {
    year: number;
    spendBasis: string;
    mode: string;
  }) => (
    <div data-testid="dashboard-infographic">
      {`${year}:${spendBasis}:${mode}`}
    </div>
  ),
}));

vi.mock('@/features/budget/components/BudgetView', async () => {
  const ReactModule = await import('react');

  return {
    BudgetView: ReactModule.forwardRef(
      (props: { planningYear: number; spendBasis: string }) => (
        <div data-testid="budget-view">
          {`${props.planningYear}:${props.spendBasis}`}
        </div>
      ),
    ),
  };
});

vi.mock('@/features/spending', async () => {
  const ReactModule = await import('react');

  return {
    SpendingView: ReactModule.forwardRef(() => (
      <div data-testid="spending-view">Spending View</div>
    )),
  };
});

vi.mock('@/features/income', async () => {
  const ReactModule = await import('react');

  return {
    IncomeView: ReactModule.forwardRef((props: { planningYear: number }) => (
      <div data-testid="income-view">{props.planningYear}</div>
    )),
  };
});

function LocationDisplay() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {`${location.pathname}${location.search}`}
    </div>
  );
}

function renderPlanningShell(initialEntry: string) {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <>
                <PlanningShellPage />
                <LocationDisplay />
              </>
            }
          />
          <Route
            path="/budget"
            element={
              <>
                <PlanningShellPage />
                <LocationDisplay />
              </>
            }
          />
          <Route
            path="/spending"
            element={
              <>
                <PlanningShellPage />
                <LocationDisplay />
              </>
            }
          />
          <Route
            path="/income"
            element={
              <>
                <PlanningShellPage />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('PlanningShellPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const storage = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        clear: vi.fn(() => {
          storage.clear();
        }),
      },
    });
  });

  it('renders the active route content and page title', () => {
    renderPlanningShell('/budget?planningYear=2026&spendBasis=annual_full_year');

    expect(screen.getByRole('heading', { name: 'Budget' })).toBeInTheDocument();
    expect(screen.getByTestId('budget-view')).toHaveTextContent(
      '2026:annual_full_year',
    );
    expect(
      screen.getByRole('button', { name: '+ Add Budget Item' }),
    ).toBeInTheDocument();
  });

  it('preserves shared planning filters when switching tabs', () => {
    renderPlanningShell('/budget?planningYear=2026&spendBasis=annual_full_year');

    fireEvent.click(screen.getByRole('button', { name: 'Spending' }));

    expect(screen.getByRole('heading', { name: 'Spending' })).toBeInTheDocument();
    expect(screen.getByTestId('spending-view')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/spending?planningYear=2026&spendBasis=annual_full_year',
    );
  });
});
