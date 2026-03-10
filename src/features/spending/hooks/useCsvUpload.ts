/**
 * Custom hook for CSV upload state and operations
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { csvUploadService } from '../services/csvUploadService';
import type { CsvParseResult, ParsedTransaction } from '../types/csvUpload';

export function useCsvUpload(onSuccess: () => void) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewData, setPreviewData] = useState<CsvParseResult | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<
    ParsedTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
    setPreviewData(null);
    setEditedTransactions([]);
  };

  const handlePreview = async () => {
    if (uploadedFiles.length === 0) return;

    setIsLoading(true);
    try {
      const result = await csvUploadService.previewCsvFiles(uploadedFiles);

      // Convert amount values from strings to numbers (Decimal serializes as string)
      const transactionsWithNumbers = result.transactions.map((t) => ({
        ...t,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
      }));

      setPreviewData(result);
      setEditedTransactions(transactionsWithNumbers);

      // Show parse errors as toast
      if (result.parse_errors.length > 0) {
        result.parse_errors.forEach((error) => toast.error(error));
      }

      // Show summary
      if (result.error_count > 0) {
        toast.warning(`⚠️ ${result.error_count} row(s) have validation errors`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Preview failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTransaction = (
    rowNumber: number,
    updates: Partial<ParsedTransaction>,
  ) => {
    setEditedTransactions((prev) =>
      prev.map((t) => (t.row_number === rowNumber ? { ...t, ...updates } : t)),
    );
  };

  const handleToggleFiltered = (rowNumber: number) => {
    setEditedTransactions((prev) =>
      prev.map((t) =>
        t.row_number === rowNumber
          ? {
              ...t,
              is_filtered: !t.is_filtered,
              filter_reason: !t.is_filtered ? t.filter_reason : null,
            }
          : t,
      ),
    );
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    setIsLoading(true);
    try {
      const result = await csvUploadService.confirmCsvUpload({
        transactions: editedTransactions,
        import_batch_id: uuidv4(),
      });

      toast.success(`✓ Imported ${result.count} transactions successfully`);

      // Reset state
      setUploadedFiles([]);
      setPreviewData(null);
      setEditedTransactions([]);

      // Notify parent to refresh data
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Import failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUploadedFiles([]);
    setPreviewData(null);
    setEditedTransactions([]);
  };

  return {
    uploadedFiles,
    previewData,
    editedTransactions,
    isLoading,
    handleFilesSelected,
    handlePreview,
    handleEditTransaction,
    handleToggleFiltered,
    handleConfirm,
    handleCancel,
  };
}
