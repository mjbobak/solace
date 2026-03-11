import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/shared/components/Button';

describe('Button', () => {
  it('uses centralized semantic classes for primary buttons', () => {
    render(<Button variant="primary">Save changes</Button>);

    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveClass('button-base');
    expect(button).toHaveClass('button-primary');
  });

  it('marks loading buttons as busy and disabled', () => {
    render(
      <Button variant="secondary" isLoading>
        Save changes
      </Button>,
    );

    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
