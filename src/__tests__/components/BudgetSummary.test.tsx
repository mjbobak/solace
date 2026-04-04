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

function getByExactText(container: HTMLElement, text: string) {
  return within(container).getByText((_, element) => element?.textContent === text);
}

function renderBudgetSummary() {
  render(
    <BudgetSummary
      totals={totals}
      totalBudgeted={4050}
      investments={1200}
      income={5900}
      savings={650}
      essentialBudget={2300}
      funsiesBudget={1750}
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
        'See how much of your income is distributed across different spending categories.',
      ),
    ).toBeInTheDocument();
    expect(
      within(incomeCard).getByRole('button', {
        name: 'Expand wealth contribution breakdown',
      }),
    ).toBeInTheDocument();
    expect(
      within(budgetCard).queryByText('Percent Used'),
    ).not.toBeInTheDocument();
    expect(
      within(incomeCard).queryByLabelText('Savings breakdown bar'),
    ).not.toBeInTheDocument();
  });

  it('expands the wealth portion inside income allocation', () => {
    renderBudgetSummary();
    const incomeCard = screen.getByRole('region', {
      name: 'Income Allocation',
    });

    fireEvent.click(
      within(incomeCard).getByRole('button', {
        name: 'Expand wealth contribution breakdown',
      }),
    );

    expect(
      within(incomeCard).getByLabelText('Savings breakdown bar'),
    ).toHaveStyle({
      left: '68.64406779661016%',
      width: '10.771003206596427%',
    });
    expect(
      within(incomeCard).getByLabelText('Budgeted investments breakdown bar'),
    ).toHaveStyle({
      left: '80.11507100320659%',
      width: '19.884928996793404%',
    });
    expect(within(incomeCard).getAllByText('$27,600').length).toBeGreaterThan(1);
    expect(within(incomeCard).getAllByText('$21,000').length).toBeGreaterThan(1);
    expect(within(incomeCard).getAllByText('$22,200').length).toBeGreaterThan(1);
    expect(within(incomeCard).getByText('$7,800')).toBeInTheDocument();
    expect(within(incomeCard).getByText('$14,400')).toBeInTheDocument();
  });

  it('shows total wealth in income allocation numbers', () => {
    renderBudgetSummary();
    const incomeCard = screen.getByRole('region', {
      name: 'Income Allocation',
    });

    fireEvent.click(
      within(incomeCard).getByRole('button', { name: 'Show numbers view' }),
    );

    expect(within(incomeCard).getByText('Wealth')).toBeInTheDocument();
    expect(
      within(incomeCard).getByText((_, element) =>
        element?.textContent === '$22,200annual',
      ),
    ).toBeInTheDocument();
    expect(within(incomeCard).getByText('Savings')).toBeInTheDocument();
    expect(
      within(incomeCard).getByText('Budgeted Investments'),
    ).toBeInTheDocument();
    expect(within(incomeCard).getByText('35%')).toBeInTheDocument();
    expect(within(incomeCard).getByText('65%')).toBeInTheDocument();
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
        totals={totals}
        totalBudgeted={4050}
        budgetUtilizationTotals={{
          budgeted: 4050,
          spent: 32000,
          remaining: 12865,
          percentage: 71.3295441885,
        }}
        investments={1200}
        income={20000}
        savings={650}
        essentialBudget={2300}
        funsiesBudget={1750}
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
});
