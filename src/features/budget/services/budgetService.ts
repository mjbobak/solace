/**
 * Budget API service
 * Handles all budget-related API calls and type conversions
 */

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import type { BudgetEntry } from '@/features/budget/types/budgetView';

import {
  backendToView,
  extractNumericId,
  viewToCreateRequest,
  viewToUpdateRequest,
} from './budgetAdapters';

const API_BASE = '/api/budgets';

export const budgetService = {
  /**
   * Get all budgets with optional filtering
   * @param options Optional filtering and pagination options
   * @param options.expenseType Filter by ESSENTIAL or FUNSIES
   * @param options.skip Number of items to skip (pagination)
   * @param options.limit Number of items to return (pagination)
   * @returns Array of budget entries
   */
  async getAllBudgets(options?: {
    expenseType?: 'ESSENTIAL' | 'FUNSIES';
    skip?: number;
    limit?: number;
  }): Promise<BudgetApiResponse[]> {
    const params = new URLSearchParams();

    if (options?.expenseType) {
      params.append('expense_type', options.expenseType);
    }
    if (options?.skip !== undefined) {
      params.append('skip', String(options.skip));
    }
    if (options?.limit !== undefined) {
      params.append('limit', String(options.limit));
    }

    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch budgets: ${response.statusText}`);
    }

    const data: BudgetApiResponse[] = await response.json();
    return data;
  },

  /**
   * Get a single budget by ID
   * @param id String ID in format "BUD-0001"
   * @returns Budget entry
   */
  async getBudgetById(id: string): Promise<BudgetEntry> {
    const numericId = extractNumericId(id);
    const response = await fetch(`${API_BASE}/${numericId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch budget: ${response.statusText}`);
    }

    const data: BudgetApiResponse = await response.json();
    return backendToView(data);
  },

  /**
   * Create a new budget
   * @param budget Budget data (without id, spent, remaining, percentage)
   * @returns Created budget entry with ID
   */
  async createBudget(
    budget: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
  ): Promise<BudgetEntry> {
    const createRequest = viewToCreateRequest(budget);

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create budget: ${errorText}`);
    }

    const data: BudgetApiResponse = await response.json();
    return backendToView(data);
  },

  /**
   * Update an existing budget
   * @param id String ID in format "BUD-0001"
   * @param updates Partial budget updates
   * @returns Updated budget entry
   */
  async updateBudget(
    id: string,
    updates: Omit<BudgetEntry, 'id' | 'spent' | 'remaining' | 'percentage'>,
  ): Promise<BudgetEntry> {
    const numericId = extractNumericId(id);
    const updateRequest = viewToUpdateRequest(updates);

    const response = await fetch(`${API_BASE}/${numericId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update budget: ${errorText}`);
    }

    const data: BudgetApiResponse = await response.json();
    return backendToView(data);
  },

  /**
   * Delete a budget
   * @param id String ID in format "BUD-0001"
   */
  async deleteBudget(id: string): Promise<void> {
    const numericId = extractNumericId(id);

    const response = await fetch(`${API_BASE}/${numericId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete budget: ${response.statusText}`);
    }
  },
};
