import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SpendingPulseSection } from '@/features/dashboard-infographic/components/SpendingPulseSection';

const { useSpendingPulseData } = vi.hoisted(() => ({
  useSpendingPulseData: vi.fn(),
}));

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

vi.mock('@/features/dashboard-infographic/hooks/useSpendingPulseData', () => ({
  useSpendingPulseData,
}));

describe('SpendingPulseSection', () => {
  it('renders real-data rows with the coverage label', () => {
    useSpendingPulseData.mockReturnValue({
      rows: [
        {
          month: 'Jan',
          monthIndex: 1,
          isRelevant: true,
          budget: 150,
          actual: 80,
          variance: 70,
          overBudgetLabels: [],
        },
        {
          month: 'Feb',
          monthIndex: 2,
          isRelevant: true,
          budget: 150,
          actual: 200,
          variance: -50,
          overBudgetLabels: [
            {
              label: 'Date Night',
              budget: 75,
              actual: 110,
              variance: -35,
            },
            {
              label: 'Impulse Buys',
              budget: 50,
              actual: 65,
              variance: -15,
            },
          ],
        },
        {
          month: 'Mar',
          monthIndex: 3,
          isRelevant: false,
          budget: 0,
          actual: 0,
          variance: 0,
          overBudgetLabels: [],
        },
      ],
      coverageLabel: 'Jan-Feb 2026 (completed months)',
      isLoading: false,
      error: null,
    });

    render(<SpendingPulseSection year={2026} />);

    expect(
      screen.queryByText('Jan-Feb 2026 (completed months)'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('+ $70')).toBeInTheDocument();
    expect(screen.getByText('- $50')).toBeInTheDocument();
    expect(screen.getByText('Under Budget')).toBeInTheDocument();
    expect(screen.getByText('Over Budget')).toBeInTheDocument();
    expect(screen.getByText('Not In Scope')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Mar is outside the current analysis window',
      }),
    ).toBeDisabled();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Track how your monthly spending compares to budget. Green indicates you stayed under budget, red means you spent more than planned. Select a month to inspect which expense labels ran over budget.',
      ),
    ).toBeInTheDocument();
  });

  it('renders loading and error states from the data hook', () => {
    useSpendingPulseData.mockReturnValueOnce({
      rows: [],
      coverageLabel: null,
      isLoading: true,
      error: null,
    });

    const { rerender } = render(<SpendingPulseSection year={2026} />);

    expect(screen.getByText('Loading spending pulse...')).toBeInTheDocument();

    useSpendingPulseData.mockReturnValueOnce({
      rows: [],
      coverageLabel: null,
      isLoading: false,
      error: 'Network down',
    });

    rerender(<SpendingPulseSection year={2026} />);

    expect(
      screen.getByText('Unable to load spending pulse: Network down'),
    ).toBeInTheDocument();
  });

  it('opens a monthly over-budget drill-down when a bar is clicked', () => {
    useSpendingPulseData.mockReturnValue({
      rows: [
        {
          month: 'Jan',
          monthIndex: 1,
          isRelevant: true,
          budget: 150,
          actual: 80,
          variance: 70,
          overBudgetLabels: [],
        },
        {
          month: 'Feb',
          monthIndex: 2,
          isRelevant: true,
          budget: 150,
          actual: 200,
          variance: -50,
          overBudgetLabels: [
            {
              label: 'Date Night',
              budget: 75,
              actual: 110,
              variance: -35,
            },
          ],
        },
      ],
      coverageLabel: 'Jan-Feb 2026 (completed months)',
      isLoading: false,
      error: null,
    });

    render(<SpendingPulseSection year={2026} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Show Feb over-budget expense labels',
      }),
    );

    expect(screen.getByText('Feb Drill Down')).toBeInTheDocument();
    expect(screen.getByText('Expense Labels Over Budget')).toBeInTheDocument();
    expect(screen.getByText('Date Night')).toBeInTheDocument();
    expect(screen.getByText('$110 actual vs $75 planned')).toBeInTheDocument();
    expect(screen.getAllByText('$35 over')).toHaveLength(1);
  });

  it('shows a clear empty state when the selected month has no over-budget expense labels', () => {
    useSpendingPulseData.mockReturnValue({
      rows: [
        {
          month: 'Jan',
          monthIndex: 1,
          isRelevant: true,
          budget: 150,
          actual: 80,
          variance: 70,
          overBudgetLabels: [],
        },
      ],
      coverageLabel: 'Jan 2026 (completed months)',
      isLoading: false,
      error: null,
    });

    render(<SpendingPulseSection year={2026} />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Show Jan over-budget expense labels',
      }),
    );

    expect(
      screen.getByText(
        'Jan stayed within budget across all tracked expense labels.',
      ),
    ).toBeInTheDocument();
  });
});
