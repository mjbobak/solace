import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from '@/shared/components/Pagination';

describe('Pagination', () => {
  it('renders the current result window', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={vi.fn()}
        pageSize={10}
        totalItems={42}
      />,
    );

    expect(
      screen.getByText('Showing 11 to 20 of 42 results'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('disables navigation at the boundaries', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
        pageSize={25}
        totalItems={0}
      />,
    );

    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('calls the page and page size callbacks', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalPages={4}
        onPageChange={onPageChange}
        pageSize={10}
        totalItems={40}
        showPageSize={true}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 25]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: '10' }));
    fireEvent.click(screen.getByRole('button', { name: '25' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
