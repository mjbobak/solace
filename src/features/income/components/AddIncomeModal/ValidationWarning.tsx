import React from 'react';
import { TbAlertTriangleFilled } from 'react-icons/tb';

interface ValidationWarningProps {
  message: string;
}

export const ValidationWarning: React.FC<ValidationWarningProps> = ({
  message,
}) => (
  <div
    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-100"
    role="alert"
    aria-live="polite"
  >
    {/* subtle accent */}
    <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-blue-400" />

    {/* Center icon to the full text block by stretching and centering */}
    <div className="flex items-stretch gap-3">
      <div className="flex w-9 shrink-0 items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center">
          <TbAlertTriangleFilled
            className="h-5 w-5 text-slate-700"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-tight text-slate-900">
          {message}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Please verify your amounts are correct. You can still save this entry.
        </p>
      </div>
    </div>
  </div>
);
