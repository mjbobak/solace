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

  it('shows a slim savings and investing summary by default', () => {
    renderBudgetSummary();
    const incomeCard = screen.getByRole('region', {
      name: 'Income Allocation',
    });
    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });
    const savingsCard = screen.getByRole('region', {
      name: 'Wealth Contributions',
    });

    expect(
      within(budgetCard).getByRole('button', { name: 'Show numbers view' }),
    ).toBeInTheDocument();
    expect(getByExactText(budgetCard, '62% used')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Budgeted')).toBeInTheDocument();
    expect(within(budgetCard).getByText('Spent')).toBeInTheDocument();
    expect(
      within(budgetCard).getAllByText((_, element) =>
        (element?.textContent ?? '').includes(
          '$5,900 income / $4,050 budget / $2,500 spent',
        ),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      within(incomeCard).getByText(
        'See how much of your income is distributed across different spending categories.',
      ),
    ).toBeInTheDocument();
    expect(
      within(budgetCard).queryByText('Percent Used'),
    ).not.toBeInTheDocument();
    expect(getByExactText(savingsCard, '31% to wealth')).toBeInTheDocument();
    expect(
      within(savingsCard).getByText(
        'See how much of your income is going toward wealth generation through savings and investments.',
      ),
    ).toBeInTheDocument();
    expect(within(savingsCard).getByText('Income')).toBeInTheDocument();
    expect(within(savingsCard).getByText('Savings')).toBeInTheDocument();
    expect(
      within(savingsCard).getByText('Budgeted Investments'),
    ).toBeInTheDocument();
  });

  it('lets the user switch budget utilization between chart and numbers', () => {
    renderBudgetSummary();
    const incomeCard = screen.getByRole('region', {
      name: 'Income Allocation',
    });
    const budgetCard = screen.getByRole('region', {
      name: 'Budget Utilization',
    });

    expect(getByExactText(budgetCard, '62% used')).toBeInTheDocument();
    expect(
      within(incomeCard).getByLabelText('Wealth portion'),
    ).toBeInTheDocument();
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
  });

  it('lets the user switch savings and investing between chart and numbers', () => {
    renderBudgetSummary();
    const savingsCard = screen.getByRole('region', {
      name: 'Wealth Contributions',
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

  it('keeps savings and budgeted investments as separate portions in the chart', () => {
    renderBudgetSummary();
    const savingsCard = screen.getByRole('region', {
      name: 'Wealth Contributions',
    });

    expect(
      within(savingsCard).getByLabelText('Savings portion'),
    ).toHaveStyle({ width: '11.016949152542372%' });
    expect(
      within(savingsCard).getByLabelText('Budgeted investments portion'),
    ).toHaveStyle({
      left: '11.016949152542372%',
      width: '20.33898305084746%',
    });
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
