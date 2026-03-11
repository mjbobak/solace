import React from 'react';

import { Button } from './Button';
import { CustomDropdown } from './CustomDropdown';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
  showPageSize?: boolean;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  showPageSize = false,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t section-divider pt-4">
      <div className="text-sm text-muted">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      <div className="flex items-center gap-4">
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Per page:</span>
            <CustomDropdown
              value={pageSize.toString()}
              options={pageSizeOptions.map((size) => ({
                value: size.toString(),
                label: size.toString(),
              }))}
              onChange={(value) => onPageSizeChange(parseInt(value, 10))}
              className="w-20"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2"
          >
            ← Prev
          </Button>

          <span className="min-w-12 text-center text-sm text-muted">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="secondary"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2"
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
};
