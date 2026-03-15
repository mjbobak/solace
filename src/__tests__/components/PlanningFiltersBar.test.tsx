import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PlanningFiltersBar } from '@/shared/components/PlanningFiltersBar';

describe('PlanningFiltersBar', () => {
  it('renders a single combined filter with expandable overflow options', () => {
    const onPlanningFiltersChange = vi.fn();

    render(
      <PlanningFiltersBar
        planningYear={2026}
        availableYears={[2026, 2025, 2024, 2023]}
        onPlanningYearChange={vi.fn()}
        spendBasis="monthly_avg_elapsed"
        onSpendBasisChange={vi.fn()}
        onPlanningFiltersChange={onPlanningFiltersChange}
        showPlanningYear
        showSpendBasis
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /plan: 2026 • completed months/i }),
    );

    expect(screen.getByText('Current Month')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show 2 more/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^2024$/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show 2 more/i }));
    fireEvent.click(screen.getByRole('button', { name: /2024.*full year/i }));

    expect(onPlanningFiltersChange).toHaveBeenCalledWith({
      planningYear: 2024,
      spendBasis: 'annual_full_year',
    });
  });
});
