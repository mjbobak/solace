import { useState, useCallback, useMemo } from 'react';

export interface UseTableSelectionResult<T> {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  toggleSelection: (id: string) => void;
  toggleAll: (allIds: string[]) => void;
  clearSelection: () => void;
  getSelectedItems: (allItems: T[], getId: (item: T) => string) => T[];
  selectedCount: number;
}

export function useTableSelection<T = unknown>(): UseTableSelectionResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = allIds.every((id) => prev.has(id));
      if (allSelected) {
        return new Set(); // Deselect all
      } else {
        return new Set(allIds); // Select all
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const getSelectedItems = useCallback(
    (allItems: T[], getId: (item: T) => string) => {
      return allItems.filter((item) => selectedIds.has(getId(item)));
    },
    [selectedIds],
  );

  const isAllSelected = useMemo(() => selectedIds.size > 0, [selectedIds.size]);

  const isSomeSelected = useMemo(
    () => selectedIds.size > 0,
    [selectedIds.size],
  );

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    getSelectedItems,
    selectedCount: selectedIds.size,
  };
}
