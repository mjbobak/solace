import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  IncomeAllocationWaterfallChart,
  type IncomeAllocationWaterfallStep,
} from '@/features/dashboard-infographic/components/IncomeAllocationWaterfallChart';

describe('IncomeAllocationWaterfallChart', () => {
  it('renders interactive and non-interactive steps with accessible button behavior', () => {
    const onStepSelect = vi.fn();
    const steps: IncomeAllocationWaterfallStep[] = [
      {
        key: 'essential',
        label: 'Essential',
        amount: 300,
        fillClassName: 'bg-blue-200',
        bucketId: 'essential',
        isInteractive: true,
        actionLabel: 'Show Essential category breakdown',
      },
      {
        key: 'savings',
        label: 'Savings',
        amount: 200,
        fillClassName: 'bg-green-200',
        bucketId: 'savings',
      },
    ];

    render(
      <IncomeAllocationWaterfallChart
        steps={steps}
        totalLabel="Total Income"
        totalAmount={1000}
        totalBarAriaLabel="Total income waterfall segment"
        onStepSelect={onStepSelect}
      />,
    );

    expect(
      screen.getByRole('group', { name: 'Income allocation waterfall chart' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show Essential category breakdown' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show Savings category breakdown' }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show Essential category breakdown' }),
    );

    expect(onStepSelect).toHaveBeenCalledWith('essential');
  });

  it('switches labels and aria metadata for detail mode totals', () => {
    const steps: IncomeAllocationWaterfallStep[] = [
      {
        key: 'entertainment',
        label: 'ENTERTAINMENT',
        amount: 120,
        fillClassName: 'bg-violet-200',
      },
      {
        key: 'family',
        label: 'FLEXIBLE FAMILY SPENDING',
        amount: 80,
        fillClassName: 'bg-violet-200',
      },
    ];

    render(
      <IncomeAllocationWaterfallChart
        steps={steps}
        totalLabel="Funsies Total"
        totalAmount={200}
        chartAriaLabel="Funsies allocation waterfall chart"
        totalBarAriaLabel="Funsies total waterfall segment"
        totalActionLabel="Back to allocation"
        onTotalSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('group', { name: 'Funsies allocation waterfall chart' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Funsies Total')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Funsies total waterfall segment'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to allocation' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Show .* category breakdown/ }),
    ).not.toBeInTheDocument();
  });
});
