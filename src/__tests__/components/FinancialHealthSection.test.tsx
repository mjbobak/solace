import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
        id: 'essential-housing',
        expenseType: 'ESSENTIAL',
        expenseCategory: 'HOUSING',
        expenseLabel: 'Mortgage',
        budgeted: 200,
        spent: 200,
        remaining: 0,
        percentage: 100,
      },
      {
        id: 'essential-utilities',
        expenseType: 'ESSENTIAL',
        expenseCategory: 'UTILITIES',
        expenseLabel: 'Utilities',
        budgeted: 100,
        spent: 95,
        remaining: 5,
        percentage: 95,
      },
      {
        id: 'funsies-entertainment',
        expenseType: 'FUNSIES',
        expenseCategory: 'ENTERTAINMENT',
        expenseLabel: 'Dining',
        budgeted: 120,
        spent: 110,
        remaining: 10,
        percentage: 91.7,
      },
      {
        id: 'funsies-family',
        expenseType: 'FUNSIES',
        expenseCategory: 'FLEXIBLE FAMILY SPENDING',
        expenseLabel: 'Travel',
        budgeted: 80,
        spent: 65,
        remaining: 15,
        percentage: 81.3,
      },
      {
        id: 'funsies-unflagged-investments',
        expenseType: 'FUNSIES',
        expenseCategory: 'INVESTMENTS',
        expenseLabel: 'Future Goals',
        budgeted: 50,
        spent: 40,
        remaining: 10,
        percentage: 80,
      },
      {
        id: 'investment-essential',
        expenseType: 'ESSENTIAL',
        expenseCategory: 'INVESTMENTS',
        expenseLabel: 'Brokerage',
        isInvestment: true,
        budgeted: 100,
        spent: 100,
        remaining: 0,
        percentage: 100,
      },
      {
        id: 'investment-funsies',
        expenseType: 'FUNSIES',
        expenseCategory: 'INVESTMENTS',
        expenseLabel: '529',
        isInvestment: true,
        budgeted: 50,
        spent: 50,
        remaining: 0,
        percentage: 100,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('FinancialHealthSection', () => {
  it('renders the income allocation card as a horizontal waterfall overview', () => {
    render(<FinancialHealthSection year={2026} />);

    expect(screen.getByText('Income Allocation')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Income allocation waterfall chart' }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Essential waterfall segment')).toHaveStyle({
      left: '0%',
      width: '30%',
    });
    expect(screen.getByLabelText('Funsies waterfall segment')).toHaveStyle({
      left: '30%',
      width: '25%',
    });
    expect(screen.getByLabelText('Wealth waterfall segment')).toHaveStyle({
      left: '55.00000000000001%',
      width: '45%',
    });
    expect(screen.getByLabelText('Total income waterfall segment')).toHaveStyle({
      width: '100%',
    });
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getAllByText('30%')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Show Funsies category breakdown' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show Wealth category breakdown' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Show Investments category breakdown',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show Savings category breakdown' }),
    ).not.toBeInTheDocument();
  });

  it('lets the user toggle funsies detail between categories and labels, then restore the overview', () => {
    render(<FinancialHealthSection year={2026} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Funsies category breakdown' }),
    );

    expect(screen.getByText('Funsies Breakdown')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Funsies allocation waterfall chart' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Funsies Total')).toBeInTheDocument();
    expect(screen.getByLabelText('ENTERTAINMENT waterfall segment')).toHaveStyle({
      left: '0%',
      width: '48%',
    });
    expect(
      screen.getByLabelText('FLEXIBLE FAMILY SPENDING waterfall segment'),
    ).toHaveStyle({
      left: '48%',
      width: '32%',
    });
    expect(screen.getByLabelText('INVESTMENTS waterfall segment')).toHaveStyle({
      left: '80%',
      width: '20%',
    });
    expect(screen.getByLabelText('Funsies total waterfall segment')).toHaveStyle({
      width: '100%',
    });
    expect(
      screen.getAllByText((_, element) =>
        (element?.textContent ?? '').includes('$250 / mo'),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Categories' }),
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Labels' }));

    expect(screen.getByRole('button', { name: 'Labels' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Dining')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();
    expect(screen.getByText('Future Goals')).toBeInTheDocument();
    expect(screen.queryByText('ENTERTAINMENT')).not.toBeInTheDocument();
    expect(screen.queryByText('FLEXIBLE FAMILY SPENDING')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to allocation' }));

    expect(
      screen.getByRole('group', { name: 'Income allocation waterfall chart' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Funsies Breakdown')).not.toBeInTheDocument();
  });

  it('defaults wealth to labels and lets the user switch back to categories', () => {
    render(<FinancialHealthSection year={2026} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Wealth category breakdown' }),
    );

    expect(screen.getByText('Wealth Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Wealth Total')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Labels' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Savings waterfall segment')).toHaveStyle({
      left: '0%',
      width: '66.66666666666666%',
    });
    expect(screen.getByLabelText('Brokerage waterfall segment')).toHaveStyle({
      left: '66.66666666666666%',
      width: '22.22222222222222%',
    });
    expect(screen.getByLabelText('529 waterfall segment')).toHaveStyle({
      left: '88.88888888888889%',
      width: '11.11111111111111%',
    });
    expect(
      screen.getByLabelText('Wealth total waterfall segment'),
    ).toHaveStyle({
      width: '100%',
    });
    expect(screen.queryByText(/^INVESTMENTS$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Future Goals')).not.toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));

    expect(
      screen.getByRole('button', { name: 'Categories' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('SAVINGS')).toBeInTheDocument();
    expect(screen.getByText('INVESTMENTS')).toBeInTheDocument();
    expect(screen.queryByText('Brokerage')).not.toBeInTheDocument();
    expect(screen.queryByText('529')).not.toBeInTheDocument();
  });

  it('drills into essential categories without including reclassified investments', () => {
    render(<FinancialHealthSection year={2026} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Essential category breakdown' }),
    );

    expect(screen.getByText('Essential Breakdown')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Categories' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('HOUSING waterfall segment')).toHaveStyle({
      left: '0%',
      width: '66.66666666666666%',
    });
    expect(screen.getByLabelText('UTILITIES waterfall segment')).toHaveStyle({
      left: '66.66666666666666%',
      width: '33.33333333333333%',
    });
    expect(screen.queryByText('INVESTMENTS')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Labels' }));

    expect(screen.getByText('Mortgage')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.queryByText('HOUSING')).not.toBeInTheDocument();
  });
});
