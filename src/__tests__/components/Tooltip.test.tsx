import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from '@/shared/components/Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the portal tooltip without capturing pointer events', () => {
    render(
      <Tooltip content="Helpful hint">
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Hover me' }));

    const tooltip = screen.getByText('Helpful hint').closest('div');

    expect(tooltip).toHaveClass('pointer-events-none');
  });
});
