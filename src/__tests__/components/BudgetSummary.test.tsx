import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BudgetSummary } from '@/features/budget/components/BudgetSummary';
import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';

const totals: BudgetTotals = {
  budgeted: 4050,
  spent: 2500,
  remaining: 1550,
  percentage: 61.7283950617,
};

const budgetEntries = [
  {
    id: 'essential-housing',
    expenseType: 'ESSENTIAL' as const,
    expenseCategory: 'HOUSING',
    expenseLabel: 'Mortgage',
    budgeted: 1500,
    spent: 1500,
    remaining: 0,
    percentage: 100,
  },
  {
    id: 'essential-utilities',
    expenseType: 'ESSENTIAL' as const,
    expenseCategory: 'UTILITIES',
    expenseLabel: 'Utilities',
    budgeted: 800,
    spent: 750,
    remaining: 50,
    percentage: 93.75,
  },
  {
    id: 'funsies-dining',
    expenseType: 'FUNSIES' as const,
    expenseCategory: 'ENTERTAINMENT',
    expenseLabel: 'Dining',
    budgeted: 900,
    spent: 700,
    remaining: 200,
    percentage: 77.8,
  },
  {
    id: 'funsies-travel',
    expenseType: 'FUNSIES' as const,
    expenseCategory: 'FLEXIBLE FAMILY SPENDING',
    expenseLabel: 'Travel',
    budgeted: 850,
    spent: 650,
    remaining: 200,
    percentage: 76.5,
  },
  {
    id: 'investment-brokerage',
    expenseType: 'ESSENTIAL' as const,
    expenseCategory: 'INVESTMENTS',
    expenseLabel: 'Brokerage',
    isInvestment: true,
    budgeted: 800,
    spent: 800,
    remaining: 0,
    percentage: 100,
  },
  {
    id: 'investment-529',
    expenseType: 'FUNSIES' as const,
    expenseCategory: 'INVESTMENTS',
    expenseLabel: '529',
    isInvestment: true,
    budgeted: 400,
    spent: 400,
    remaining: 0,
    percentage: 100,
  },
];

function getByExactText(container: HTMLElement, text: string) {
  return within(container).getByText((_, element) => element?.textContent === text);
}

function renderBudgetSummary() {
  render(
    <BudgetSummary
      budgetEntries={budgetEntries}
      totals={totals}
      income={5900}
      isBudgetFiltered={false}
      planningYear={2026}
      spendBasis="monthly_avg_12"
    />,
  );
}

describe('BudgetSummary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the integrated allocation summary by default', () => {
    renderBudgetSummary();
    const incomeCard = screen.getByRole('region', {
      name: 'Income Allocation',
    });
    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });

    expect(
      screen.queryByRole('region', { name: 'Wealth Contributions' }),
    ).not.toBeInTheDocument();
    expect(
      within(budgetCard).getByRole('button', { name: 'Show numbers view' }),
    ).toBeInTheDocument();
    expect(getByExactText(budgetCard, '62% used')).toBeInTheDocument();
    expect(within(budgetCard).getAllByText('Remaining')).toHaveLength(1);
    expect(within(budgetCard).getAllByText('Spent')).toHaveLength(1);
    expect(
      within(budgetCard).getAllByText((_, element) =>
        (element?.textContent ?? '').includes(
          '$5,900 income / $4,050 budget / $2,500 spent',
        ),
      ).length,
    ).toBeGreaterThan(0);
    expect(within(budgetCard).getAllByText('$2,500').length).toBeGreaterThan(1);
    expect(within(budgetCard).getByText('$1,550')).toBeInTheDocument();
    expect(
      within(incomeCard).getByText(
        'A waterfall view of how your current monthly plan allocates total income across essentials, funsies, and wealth.',
      ),
    ).toBeInTheDocument();
    expect(
      within(incomeCard).getByRole('button', {
        name: 'Show Wealth category breakdown',
      }),
    ).toBeInTheDocument();
    expect(
      within(incomeCard).getByLabelText('Wealth waterfall segment'),
    ).toHaveStyle({
      left: '68.64406779661016%',
      width: '31.35593220338983%',
    });
    expect(
      within(budgetCard).queryByText('Percent Used'),
    ).not.toBeInTheDocument();
    expect(
      within(incomeCard).queryByRole('button', { name: 'Show numbers view' }),
    ).not.toBeInTheDocument();
    expect(
      within(incomeCard).queryByLabelText('Savings waterfall segment'),
    ).not.toBeInTheDocument();
  });

  it('uses the shared wealth drilldown behavior inside income allocation', () => {
    renderBudgetSummary();
    const incomeCard = screen.getByRole('region', {
      name: 'Income Allocation',
    });

    fireEvent.click(
      within(incomeCard).getByRole('button', {
        name: 'Show Wealth category breakdown',
      }),
    );

    expect(
      within(incomeCard).getByRole('button', { name: 'Labels' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(within(incomeCard).getByText('Wealth Breakdown')).toBeInTheDocument();
    expect(within(incomeCard).getByText('Wealth Total')).toBeInTheDocument();
    expect(
      within(incomeCard).getByLabelText('Brokerage waterfall segment'),
    ).toHaveStyle({
      left: '0%',
      width: '43.24324324324324%',
    });
    expect(
      within(incomeCard).getByLabelText('Savings waterfall segment'),
    ).toHaveStyle({
      left: '43.24324324324324%',
      width: '35.13513513513514%',
    });
    fireEvent.click(
      within(incomeCard).getByRole('button', { name: 'Categories' }),
    );

    expect(
      within(incomeCard).getByRole('button', { name: 'Categories' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(within(incomeCard).getByText('INVESTMENTS')).toBeInTheDocument();
    expect(within(incomeCard).getByText('SAVINGS')).toBeInTheDocument();
    expect(within(incomeCard).queryByText('Brokerage')).not.toBeInTheDocument();

    fireEvent.click(
      within(incomeCard).getByRole('button', { name: 'Back to allocation' }),
    );

    expect(
      within(incomeCard).getByRole('group', {
        name: 'Income allocation waterfall chart',
      }),
    ).toBeInTheDocument();
    expect(
      within(incomeCard).queryByText('Wealth Breakdown'),
    ).not.toBeInTheDocument();
  });

  it('lets the user switch budget utilization between chart and numbers', () => {
    renderBudgetSummary();
    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });

    expect(getByExactText(budgetCard, '62% used')).toBeInTheDocument();

    fireEvent.click(
      within(budgetCard).getByRole('button', { name: 'Show numbers view' }),
    );

    expect(
      within(budgetCard).getByRole('button', { name: 'Show chart view' }),
    ).toBeInTheDocument();
    expect(within(budgetCard).queryByText('62% used')).not.toBeInTheDocument();
    expect(within(budgetCard).getByText('Income')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Budgeted')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Spent')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Remaining')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Percent Used')).toBeInTheDocument();
  });

  it('uses completed-month totals only for budget utilization', () => {
    render(
      <BudgetSummary
        budgetEntries={budgetEntries}
        totals={totals}
        budgetUtilizationTotals={{
          budgeted: 4050,
          spent: 32000,
          remaining: 12865,
          percentage: 71.3295441885,
        }}
        income={20000}
        isBudgetFiltered={true}
        planningYear={2026}
        spendBasis="monthly_avg_elapsed"
      />,
    );

    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });

    expect(
      within(budgetCard).getByText((_, element) =>
        element?.textContent ===
        'Total for completed months: $60,000 income / $44,865 budget / $32,000 spent',
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      within(budgetCard).getByRole('button', { name: 'Show numbers view' }),
    );

    expect(within(budgetCard).getAllByText('Total for completed months')).toHaveLength(
      4,
    );
    expect(within(budgetCard).getByText('$44,865')).toBeInTheDocument();
    expect(within(budgetCard).getByText('$32,000')).toBeInTheDocument();
  });

  it('shows over-budget text in the chart when spending exceeds budget', () => {
    render(
      <BudgetSummary
        budgetEntries={budgetEntries}
        totals={totals}
        budgetUtilizationTotals={{
          budgeted: 4050,
          spent: 5000,
          remaining: -950,
          percentage: 123.4567901235,
        }}
        income={5900}
        isBudgetFiltered={false}
        planningYear={2026}
        spendBasis="monthly_avg_12"
      />,
    );

    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });

    expect(within(budgetCard).getByText('$950 over')).toBeInTheDocument();
    expect(within(budgetCard).queryByText('$0')).not.toBeInTheDocument();
  });
});
