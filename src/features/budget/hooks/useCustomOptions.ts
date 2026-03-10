import { useEffect, useState } from 'react';

import { EXPENSE_TYPES } from '@/features/budget/constants/expenseConfig';
import { categoryService } from '@/shared/services/categoryService';
import type { ExpenseCategory } from '@/shared/types/category';

interface UseCustomOptionsReturn {
  customExpenseTypes: string[];
  setCustomExpenseTypes: (types: string[]) => void;
  categories: ExpenseCategory[];
  isLoadingCategories: boolean;
  categoryError: string | null;
  getAllExpenseTypeOptions: () => string[];
  getCategoryById: (id: number) => ExpenseCategory | undefined;
  getCategoryByName: (name: string) => ExpenseCategory | undefined;
  addCategory: (name: string) => Promise<ExpenseCategory>;
}

/**
 * Custom hook for managing expense types and categories.
 *
 * Fetches categories from the backend API and manages custom category creation.
 */
export function useCustomOptions(): UseCustomOptionsReturn {
  const [customExpenseTypes, setCustomExpenseTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError(null);

      try {
        const fetchedCategories = await categoryService.getAll();
        setCategories(fetchedCategories);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load categories';
        setCategoryError(message);
        console.error('Error loading categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const getAllExpenseTypeOptions = (): string[] => {
    return [...EXPENSE_TYPES, ...customExpenseTypes];
  };

  const getCategoryById = (id: number): ExpenseCategory | undefined => {
    return categories.find((cat) => cat.id === id);
  };

  const getCategoryByName = (name: string): ExpenseCategory | undefined => {
    return categories.find((cat) => cat.name === name);
  };

  const addCategory = async (name: string): Promise<ExpenseCategory> => {
    try {
      const newCategory = await categoryService.create(name);
      setCategories((prev) =>
        [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return newCategory;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create category';
      setCategoryError(message);
      throw error;
    }
  };

  return {
    customExpenseTypes,
    setCustomExpenseTypes,
    categories,
    isLoadingCategories,
    categoryError,
    getAllExpenseTypeOptions,
    getCategoryById,
    getCategoryByName,
    addCategory,
  };
}
