/**
 * Backend API type definitions
 * These types match the Pydantic schemas from the backend
 */

/**
 * Budget response from backend API
 * Matches BudgetResponse from backend/app/models/budget.py
 */
export interface BudgetApiResponse {
  id: number;
  expense_type: string;
  expense_category: string;
  expense_label: string;
  expense_label_note?: string;
  is_investment: boolean;
  budgeted: number;
  is_accrual: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating a budget
 * Matches BudgetCreate from backend/app/models/budget.py
 */
export interface BudgetApiCreate {
  expense_type: string;
  expense_category: string;
  expense_label: string;
  expense_label_note?: string;
  is_investment: boolean;
  budgeted: number;
  is_accrual: boolean;
}

/**
 * Request payload for updating a budget
 * Matches BudgetUpdate from backend/app/models/budget.py
 * All fields are optional for partial updates
 */
export interface BudgetApiUpdate {
  expense_type?: string;
  expense_category?: string;
  expense_label?: string;
  expense_label_note?: string;
  is_investment?: boolean;
  budgeted?: number;
  is_accrual?: boolean;
}
