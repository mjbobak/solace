import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Pagination } from '@/shared/components/data';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: vi.fn(),
  };

  it('renders current page and total pages', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText('Page', { exact: false })).toBeInTheDocument();
    const allNumberOnes = screen.getAllByText('1');
    const allNumberFives = screen.getAllByText('5');
    expect(allNumberOnes.length).toBeGreaterThan(0);
    expect(allNumberFives.length).toBeGreaterThan(0);
  });

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    const prevButton = screen.getAllByRole('button')[0];
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={5} />);
    const nextButton = screen.getAllByRole('button')[1];
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when previous button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={3}
        onPageChange={onPageChange}
      />,
    );

    const prevButton = screen.getAllByRole('button')[0];
    fireEvent.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when next button is clicked', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={3}
        onPageChange={onPageChange}
      />,
    );

    const nextButton = screen.getAllByRole('button')[1];
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('displays total items when provided', () => {
    render(<Pagination {...defaultProps} totalItems={100} pageSize={10} />);
    expect(screen.getByText('Showing', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/results/i)).toBeInTheDocument();
  });

  it('shows page size selector when enabled', () => {
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        showPageSize={true}
        pageSize={10}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    expect(screen.getByText('Per page:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onPageSizeChange and resets to page 1', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={3}
        showPageSize={true}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '25' } });

    expect(onPageSizeChange).toHaveBeenCalledWith(25);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
