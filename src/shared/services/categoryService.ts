/**
 * Service for managing expense categories via API.
 *
 * This service provides methods to fetch, create, update, and delete expense categories
 * from the backend API.
 */

import type { ExpenseCategory } from '../types/category';

/**
 * API service for expense categories.
 *
 * All methods communicate with the /api/expense-categories endpoints.
 */
export const categoryService = {
  /**
   * Get all expense categories sorted alphabetically.
   *
   * @returns Promise resolving to array of categories
   * @throws Error if fetch fails
   */
  async getAll(): Promise<ExpenseCategory[]> {
    const response = await fetch('/api/expense-categories');

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get a single expense category by ID.
   *
   * @param id - Category ID
   * @returns Promise resolving to the category
   * @throws Error if fetch fails or category not found
   */
  async getById(id: number): Promise<ExpenseCategory> {
    const response = await fetch(`/api/expense-categories/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Category ${id} not found`);
      }

      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Create a new expense category.
   *
   * @param name - Category name
   * @returns Promise resolving to the created category
   * @throws Error if creation fails (e.g., duplicate name)
   */
  async create(name: string): Promise<ExpenseCategory> {
    const response = await fetch('/api/expense-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.detail || `Failed to create category: ${response.statusText}`,
      );
    }

    return response.json();
  },

  /**
   * Update an existing expense category.
   *
   * @param id - Category ID to update
   * @param name - New category name
   * @returns Promise resolving to the updated category
   * @throws Error if update fails (e.g., duplicate name, not found)
   */
  async update(id: number, name: string): Promise<ExpenseCategory> {
    const response = await fetch(`/api/expense-categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.detail || `Failed to update category: ${response.statusText}`,
      );
    }

    return response.json();
  },

  /**
   * Delete an expense category.
   *
   * A category can only be deleted if it's not in use by any budget entries.
   *
   * @param id - Category ID to delete
   * @throws Error if deletion fails (e.g., category in use, not found)
   */
  async delete(id: number): Promise<void> {
    const response = await fetch(`/api/expense-categories/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.detail || `Failed to delete category: ${response.statusText}`,
      );
    }
  },

  /**
   * Check how many budgets use a specific category.
   *
   * @param id - Category ID
   * @returns Promise resolving to the count object { id, count }
   * @throws Error if check fails or category not found
   */
  async checkUsage(id: number): Promise<{ id: number; count: number }> {
    const response = await fetch(`/api/expense-categories/${id}/usage`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Category ${id} not found`);
      }

      throw new Error(`Failed to check usage: ${response.statusText}`);
    }

    return response.json();
  },
};
