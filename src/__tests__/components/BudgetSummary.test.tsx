import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { BudgetSummary } from '@/features/budget/components/BudgetSummary';
import type { BudgetTotals } from '@/features/budget/hooks/useBudgetCalculations';

const totals: BudgetTotals = {
  budgeted: 4050,
  spent: 2500,
  remaining: 1550,
  percentage: 61.7283950617,
};

function renderBudgetSummary() {
  render(
    <BudgetSummary
      totals={totals}
      totalBudgeted={4050}
      investments={1200}
      income={5900}
      savings={650}
      isBudgetFiltered={false}
      planningYear={2026}
      spendBasis="monthly_avg_12"
    />,
  );
}

describe('BudgetSummary', () => {
  it('shows a slim savings and investing summary by default', () => {
    renderBudgetSummary();
    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });
    const savingsCard = screen.getByRole('region', {
      name: 'Savings & Investing',
    });

    expect(
      within(budgetCard).getByRole('button', { name: 'Show numbers view' }),
    ).toBeInTheDocument();
    expect(within(budgetCard).getByText('62% used')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Income')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Budgeted')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Spent')).toBeInTheDocument();
    expect(
      within(budgetCard).queryByText('Percent Used'),
    ).not.toBeInTheDocument();
    expect(within(savingsCard).getByText('31% to wealth')).toBeInTheDocument();
    expect(within(savingsCard).getByText('Income')).toBeInTheDocument();
    expect(within(savingsCard).getByText('Savings')).toBeInTheDocument();
    expect(
      within(savingsCard).getByText('Budgeted Investments'),
    ).toBeInTheDocument();
  });

  it('lets the user switch budget utilization between chart and numbers', () => {
    renderBudgetSummary();
    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });

    expect(within(budgetCard).getByText('62% used')).toBeInTheDocument();
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

  it('lets the user switch savings and investing between chart and numbers', () => {
    renderBudgetSummary();
    const savingsCard = screen.getByRole('region', {
      name: 'Savings & Investing',
    });

    fireEvent.click(
      within(savingsCard).getByRole('button', { name: 'Show numbers view' }),
    );

    expect(within(savingsCard).getByText('Total Going to Wealth')).toBeInTheDocument();
    expect(within(savingsCard).getByText('Savings')).toBeInTheDocument();
    expect(within(savingsCard).getByText('Budgeted Investments')).toBeInTheDocument();
    expect(within(savingsCard).getByText('Total Going to Wealth')).toBeInTheDocument();
    expect(
      within(savingsCard).getByText((_, element) =>
        element?.textContent === '$7,800annual',
      ),
    ).toBeInTheDocument();
    expect(
      within(savingsCard).getByText((_, element) =>
        element?.textContent === '$14,400annual',
      ),
    ).toBeInTheDocument();
    expect(
      within(savingsCard).getByText((_, element) =>
        element?.textContent === '$22,200annual',
      ),
    ).toBeInTheDocument();
    expect(
      within(savingsCard).getByRole('button', { name: 'Show chart view' }),
    ).toBeInTheDocument();
  });
});
