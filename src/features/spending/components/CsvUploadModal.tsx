/**
 * CSV upload modal - orchestrates the upload flow
 */

import React, { useRef, useEffect } from 'react';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import { Button } from '@/shared/components/Button';

import { useCsvUpload } from '../hooks/useCsvUpload';

import { CsvPreviewTableEnhanced } from './CsvPreviewTableEnhanced';

interface CsvUploadModalProps {
  onSuccess: () => void;
  budgets: BudgetApiResponse[];
  isLoadingBudgets?: boolean;
  onPreviewStateChange?: (showing: boolean) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  onSuccess,
  budgets,
  isLoadingBudgets = false,
  onPreviewStateChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
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
  } = useCsvUpload(onSuccess);

  useEffect(() => {
    onPreviewStateChange?.(!!previewData);
  }, [previewData, onPreviewStateChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFilesSelected(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    handleFilesSelected(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const accountHints = [
    {
      label: 'Chase credit card',
      value: '1466',
    },
    {
      label: 'Chase checking',
      value: '2939',
    },
  ];

  // No preview - show file upload area
  if (!previewData) {
    return (
      <div className="space-y-5">
        <div className="import-panel">
          <div className="import-panel-header">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <p className="import-kicker">Bulk Import</p>
                <h3 className="import-title">
                  Upload CSV exports and review them before import
                </h3>
                <p className="import-description max-w-2xl">
                  Use this flow for larger batches. You can edit rows, exclude
                  anything you do not want, and confirm only the cleaned data.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {accountHints.map((hint) => (
                  <div
                    key={hint.value}
                    className="import-card"
                  >
                    <div className="import-card-label">Expected file</div>
                    <div className="import-card-value">
                      {hint.label}
                    </div>
                    <div className="import-card-label">
                      Filename should contain {hint.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="import-dropzone"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="import-dropzone-icon">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="import-title text-base">
                    Drop CSV files here
                  </h4>
                  <p className="import-description mt-1">
                    Or browse from your computer. Up to 2 files per import.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.CSV"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="import-secondary-action"
                >
                  Select Files
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {uploadedFiles.length > 0 && (
          <div className="import-list">
            <div className="import-panel-header flex items-center justify-between py-3">
              <p className="text-app text-sm font-semibold">Selected Files</p>
              <span className="text-muted text-xs font-medium">
                {uploadedFiles.length} of 2
              </span>
            </div>
            <div className="space-y-2 px-5 py-4 sm:px-6">
              {uploadedFiles.map((file) => {
                const hasAccount = ['1466', '2939'].some((acc) =>
                  file.name.includes(acc),
                );
                return (
                  <div
                    key={file.name}
                    className="import-list-row"
                  >
                    <div className="import-list-icon">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8 16.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z" />
                        <path d="M9 0h2v13H9z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-app truncate text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="text-muted text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <span
                      className={`import-status-pill ${
                        hasAccount
                          ? 'import-status-pill-success'
                          : 'import-status-pill-warning'
                      }`}
                    >
                      {hasAccount ? 'Account detected' : 'Check filename'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="import-actions sm:justify-end">
          <Button
            onClick={handleCancel}
            variant="secondary"
            className="sm:min-w-32"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePreview}
            variant="primary"
            className="sm:min-w-40"
            disabled={uploadedFiles.length === 0 || isLoading}
            isLoading={isLoading}
          >
            Review Import
          </Button>
        </div>
      </div>
    );
  }

  // Show preview
  return (
    <div className="space-y-4">
      <CsvPreviewTableEnhanced
        transactions={editedTransactions}
        budgets={budgets}
        isLoadingBudgets={isLoadingBudgets}
        onEditTransaction={handleEditTransaction}
        onToggleFiltered={handleToggleFiltered}
        stats={{
          total: previewData.total_count,
          importing: previewData.import_count,
          filtered: previewData.filtered_count,
          errors: previewData.error_count,
        }}
      />

      {/* Parse Errors */}
      {previewData.parse_errors.length > 0 && (
        <div className="rounded-2xl border px-5 py-4 sm:px-6 import-status-pill-danger">
          <h3 className="mb-2 text-sm font-semibold">
            Parsing Errors
          </h3>
          <ul className="space-y-1">
            {previewData.parse_errors.map((error, i) => (
              <li key={i} className="text-xs">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="import-actions sm:items-center sm:justify-between">
        <p className="text-muted text-sm">
          Review the rows you want to keep, then confirm the import.
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            onClick={handleCancel}
            variant="secondary"
            className="sm:min-w-32"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            className="sm:min-w-44"
            disabled={previewData.import_count === 0 || isLoading}
            isLoading={isLoading}
          >
            Confirm Import
          </Button>
        </div>
      </div>
    </div>
  );
};
