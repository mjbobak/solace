import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

    expect(
      screen.getByRole('button', { name: 'Show numbers view' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Income Capacity')).toBeInTheDocument();
    expect(screen.getByText('62% used')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Budgeted')).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.queryByText('Percent Used')).not.toBeInTheDocument();
    expect(screen.getByText('Savings & Investing')).toBeInTheDocument();
    expect(screen.getByText('Total Going to Wealth')).toBeInTheDocument();
    expect(screen.getByText('$1,850')).toBeInTheDocument();
    expect(screen.getByText('31.4% of income')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Budgeted Investments')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show breakdown/i }),
    ).toBeInTheDocument();

    expect(screen.queryByText('Planned Income')).not.toBeInTheDocument();
    expect(screen.queryByText('Planned Savings')).not.toBeInTheDocument();
    expect(screen.queryByText('Planned Investments')).not.toBeInTheDocument();
  });

  it('lets the user switch budget utilization between chart and numbers', () => {
    renderBudgetSummary();

    expect(screen.getByText('Income Capacity')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show numbers view' }));

    expect(
      screen.getByRole('button', { name: 'Show chart view' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Income Capacity')).not.toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Budgeted')).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
    expect(screen.getByText('Percent Used')).toBeInTheDocument();
  });

  it('reveals and hides the breakdown details on demand', () => {
    renderBudgetSummary();

    fireEvent.click(screen.getByRole('button', { name: /show breakdown/i }));

    expect(screen.getByText('Planned Income')).toBeInTheDocument();
    expect(screen.getByText('Total Budgeted')).toBeInTheDocument();
    expect(screen.getByText('Planned Savings')).toBeInTheDocument();
    expect(screen.getByText('Planned Investments')).toBeInTheDocument();
    expect(screen.getAllByText('Total Going to Wealth')).toHaveLength(2);
    expect(screen.getByText('$70,800 annual')).toBeInTheDocument();
    expect(screen.getByText('$48,600 annual')).toBeInTheDocument();
    expect(screen.getByText('$7,800 annual')).toBeInTheDocument();
    expect(screen.getByText('$14,400 annual')).toBeInTheDocument();
    expect(screen.getByText('$22,200 annual')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide breakdown/i }));

    expect(screen.queryByText('Planned Income')).not.toBeInTheDocument();
    expect(screen.queryByText('$70,800 annual')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show breakdown/i }),
    ).toBeInTheDocument();
  });
});
