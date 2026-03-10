/**
 * Income feature configuration and constants
 * Centralized configuration for income types, frequencies, and UI options
 */

import type { IncomeType, IncomeFrequency, InputType } from '../types/income';

// Input type options (how user enters income data)
export const INPUT_TYPES: InputType[] = [
  'Net Paycheck',
  'Gross Paycheck',
  'Custom Amount',
  'Monthly Amount',
];

// Income type options
export const INCOME_TYPES: IncomeType[] = ['regular', 'bonus'];

// Frequency options for one-time income
export const INCOME_FREQUENCIES: IncomeFrequency[] = [
  'annual',
  'quarterly',
  'monthly',
  'one-time',
];

export const INCOME_FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  annual: 'Annual',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
  'one-time': 'One-Time',
};

/**
 * Frequency multipliers for calculations
 * Used to convert a single amount into annual totals
 * e.g., if someone gets a quarterly bonus, multiply amount by 4
 */
export const INCOME_FREQUENCY_MULTIPLIERS: Record<IncomeFrequency, number> = {
  annual: 1,
  quarterly: 4,
  monthly: 12,
  'one-time': 1,
};

// Pay period options (how often income is paid)
export const PAY_PERIODS_OPTIONS = [
  { value: 52, label: 'Weekly (52)' },
  { value: 26, label: 'Biweekly (26)' },
  { value: 24, label: 'Semi-monthly (24)' },
  { value: 12, label: 'Monthly (12)' },
  { value: 4, label: 'Quarterly (4)' },
  { value: 1, label: 'Annual (1)' },
] as const;

// Deduction field definitions for date range editing
export const DEDUCTION_FIELDS = [
  { key: 'federalTax', label: 'Federal Tax' },
  { key: 'stateTax', label: 'State Tax' },
  { key: 'fica', label: 'FICA (SS + Medicare)' },
  { key: 'retirement', label: '401(k) / Retirement' },
  { key: 'healthInsurance', label: 'Health Insurance' },
  { key: 'other', label: 'Other Deductions' },
] as const;
