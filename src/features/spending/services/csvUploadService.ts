/**
 * CSV upload service for API communication
 */

import type { CsvParseResult, CsvUploadConfirm } from '../types/csvUpload';

export const csvUploadService = {
  /**
   * Upload CSV files for preview (no database insertion)
   *
   * @param files - Array of CSV files to preview
   * @returns CsvParseResult with parsed transactions
   * @throws Error if preview fails
   */
  previewCsvFiles: async (files: File[]): Promise<CsvParseResult> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch('/api/transactions/upload/preview', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to preview CSV files');
    }

    return response.json();
  },

  /**
   * Confirm and save transactions to database
   *
   * @param data - Confirmation request with transactions and batch ID
   * @returns Import result with count
   * @throws Error if import fails
   */
  confirmCsvUpload: async (
    data: CsvUploadConfirm,
  ): Promise<{ count: number }> => {
    const response = await fetch('/api/transactions/upload/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to import transactions');
    }

    return response.json();
  },
};
