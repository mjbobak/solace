import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FinancialHealthSection } from '@/features/dashboard-infographic/components/FinancialHealthSection';

vi.mock(
  '@/features/dashboard-infographic/components/ScrollAnimatedSection',
  () => ({
    ScrollAnimatedSection: ({
      children,
      className,
    }: {
      children: ReactNode;
      className?: string;
    }) => <section className={className}>{children}</section>,
  }),
);

vi.mock('@/shared/components/Tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/features/dashboard-infographic/hooks/useIncomeAnalysis', () => ({
  useIncomeAnalysis: () => ({
    totalIncome: 12000,
    plannedNetIncome: 12000,
    sourceBreakdown: [],
    typeBreakdown: [
      { type: 'base_pay', amount: 10000, percentage: 83.3 },
      { type: 'bonus', amount: 2000, percentage: 16.7 },
    ],
    trend: [],
  }),
}));

vi.mock('@/features/budget/hooks/useBudgetData', () => ({
  useBudgetData: () => ({
    budgetEntries: [
      {
        id: 'essential',
        expenseType: 'ESSENTIAL',
        expenseCategory: 'Housing',
        expenseLabel: 'Rent',
        budgeted: 300,
        spent: 280,
        remaining: 20,
        percentage: 93.3,
      },
      {
        id: 'funsies',
        expenseType: 'FUNSIES',
        expenseCategory: 'Fun',
        expenseLabel: 'Dining',
        budgeted: 200,
        spent: 180,
        remaining: 20,
        percentage: 90,
      },
      {
        id: 'investment',
        expenseType: 'ESSENTIAL',
        expenseCategory: 'Investments',
        expenseLabel: 'Brokerage',
        isInvestment: true,
        budgeted: 100,
        spent: 100,
        remaining: 0,
        percentage: 100,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('FinancialHealthSection', () => {
  it('renders the income allocation card as a horizontal waterfall', () => {
    render(<FinancialHealthSection year={2026} />);

    expect(screen.getByText('Income Allocation')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Income allocation waterfall chart' }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Essential waterfall segment')).toHaveStyle({
      left: '0%',
      width: '30%',
    });
    expect(screen.getByLabelText('Funsies waterfall segment')).toHaveStyle({
      left: '30%',
      width: '20%',
    });
    expect(screen.getByLabelText('Investments waterfall segment')).toHaveStyle({
      left: '50%',
      width: '10%',
    });
    expect(screen.getByLabelText('Savings waterfall segment')).toHaveStyle({
      left: '60%',
      width: '40%',
    });
    expect(screen.getByLabelText('Total income waterfall segment')).toHaveStyle({
      width: '100%',
    });
    expect(
      screen.getByText('Wealth capture is 50.0% of income.'),
    ).toBeInTheDocument();
    expect(screen.getByText('$6,000 annual')).toBeInTheDocument();
    expect(screen.getByText('40.0%')).toBeInTheDocument();
  });
});
