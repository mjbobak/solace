/**
 * CSV upload modal - orchestrates the upload flow
 */

import React, { useRef, useEffect } from 'react';

import { Button } from '@/shared/components/Button';

import { useCsvUpload } from '../hooks/useCsvUpload';

import { CsvPreviewTableEnhanced } from './CsvPreviewTableEnhanced';

interface CsvUploadModalProps {
  onSuccess: () => void;
  onPreviewStateChange?: (showing: boolean) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  onSuccess,
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Bulk Import
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Upload CSV exports and review them before import
                </h3>
                <p className="max-w-2xl text-sm text-slate-600">
                  Use this flow for larger batches. You can edit rows, exclude
                  anything you do not want, and confirm only the cleaned data.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {accountHints.map((hint) => (
                  <div
                    key={hint.value}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="text-xs font-medium text-slate-500">
                      Expected file
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {hint.label}
                    </div>
                    <div className="text-xs text-slate-500">
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
              className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 transition-colors hover:border-slate-400"
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg
                    className="h-6 w-6 text-slate-700"
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
                  <h4 className="text-base font-semibold text-slate-900">
                    Drop CSV files here
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
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
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  Select Files
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {uploadedFiles.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 sm:px-6">
              <p className="text-sm font-semibold text-slate-900">
                Selected Files
              </p>
              <span className="text-xs font-medium text-slate-500">
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
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
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
                      <p className="truncate text-sm font-medium text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        hasAccount
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
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
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <Button onClick={handleCancel} variant="secondary" className="sm:min-w-32">
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 sm:px-6">
          <h3 className="mb-2 text-sm font-semibold text-rose-900">
            Parsing Errors
          </h3>
          <ul className="space-y-1">
            {previewData.parse_errors.map((error, i) => (
              <li key={i} className="text-xs text-rose-700">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Review the rows you want to keep, then confirm the import.
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button onClick={handleCancel} variant="secondary" className="sm:min-w-32">
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
