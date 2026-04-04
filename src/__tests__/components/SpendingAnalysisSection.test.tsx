import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SpendingAnalysisSection } from '@/features/dashboard-infographic/components/SpendingAnalysisSection';

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

vi.mock(
  '@/features/dashboard-infographic/hooks/useDashboardSpendingAnalysis',
  () => ({
    useDashboardSpendingAnalysis: () => ({
      analysis: {
        totalsByFilter: {
          ALL: 10000,
          ESSENTIAL: 10000,
          FUNSIES: 0,
        },
        categoriesByFilter: {
          ALL: [
            { name: 'Housing', value: 4500 },
            { name: 'Debt Obligations', value: 3000 },
            { name: 'Utilities', value: 2500 },
          ],
          ESSENTIAL: [
            { name: 'Housing', value: 4500 },
            { name: 'Debt Obligations', value: 3000 },
            { name: 'Utilities', value: 2500 },
          ],
          FUNSIES: [],
        },
      },
      isLoading: false,
      error: null,
    }),
  }),
);

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({
    children,
    layout,
  }: {
    children: ReactNode;
    layout?: string;
  }) => (
    <div data-testid="recharts-bar-chart" data-layout={layout}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: ({
    domain,
    hide,
    type,
  }: {
    domain?: [number, number];
    hide?: boolean;
    type?: string;
  }) => (
    <div
      data-testid="x-axis"
      data-domain={JSON.stringify(domain)}
      data-hide={String(Boolean(hide))}
      data-type={type}
    />
  ),
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Bar: ({
    children,
    dataKey,
  }: {
    children?: ReactNode;
    dataKey?: string;
  }) => (
    <div data-testid="bar" data-key={dataKey}>
      {children}
    </div>
  ),
  LabelList: ({
    dataKey,
    position,
  }: {
    dataKey?: string;
    position?: string;
  }) => (
    <div
      data-testid="label-list"
      data-key={dataKey}
      data-position={position}
    />
  ),
}));

describe('SpendingAnalysisSection', () => {
  it('uses the same explicit numeric axis domain for the bars and footer scale', () => {
    render(<SpendingAnalysisSection year={2026} />);

    const xAxes = screen.getAllByTestId('x-axis');

    expect(xAxes).toHaveLength(2);
    expect(xAxes[0]).toHaveAttribute('data-type', 'number');
    expect(xAxes[0]).toHaveAttribute('data-hide', 'true');
    expect(xAxes[0]).toHaveAttribute('data-domain', '[0,4860]');
    expect(xAxes[1]).toHaveAttribute('data-type', 'number');
    expect(xAxes[1]).toHaveAttribute('data-hide', 'false');
    expect(xAxes[1]).toHaveAttribute('data-domain', '[0,4860]');
    expect(screen.getAllByTestId('recharts-bar-chart')).toHaveLength(2);
  });
});
