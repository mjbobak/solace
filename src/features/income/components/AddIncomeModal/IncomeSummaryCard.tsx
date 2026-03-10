/**
 * Summary sidebar showing real-time income calculations
 */

import React from 'react';

import { formatCurrency } from '@/shared/utils/currency';

interface IncomeSummaryCardProps {
  grossPayAmount: number;
  netPayAmount: number;
  annualGross: number;
  annualNet: number;
  monthlyGross: number;
  monthlyNet: number;
}

export const IncomeSummaryCard: React.FC<IncomeSummaryCardProps> = ({
  grossPayAmount,
  netPayAmount,
  annualGross,
  annualNet,
  monthlyGross,
  monthlyNet,
}) => (
  <div className="sticky top-4 space-y-4">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
      Income Summary
    </h3>

    {/* Main Summary Card */}
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 space-y-4 shadow-lg">
      {/* Per Period */}
      <SummarySection title="Per Pay Period">
        <SummaryRow label="Gross" value={grossPayAmount} large />
        <SummaryRow label="Net" value={netPayAmount} muted />
      </SummarySection>

      <Divider />

      {/* Annual */}
      <SummarySection title="Annual Totals">
        <SummaryRow label="Gross" value={annualGross} />
        <SummaryRow label="Net" value={annualNet} />
      </SummarySection>

      <Divider />

      {/* Monthly Average */}
      <SummarySection title="Monthly Average (÷12)">
        <SummaryRow label="Gross" value={monthlyGross} />
        <SummaryRow label="Net" value={monthlyNet} />
      </SummarySection>
    </div>
  </div>
);

const SummarySection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="space-y-2">
    <p className="text-blue-100 text-xs uppercase tracking-wide font-medium">
      {title}
    </p>
    <div className="space-y-1">{children}</div>
  </div>
);

const SummaryRow: React.FC<{
  label: string;
  value: number;
  large?: boolean;
  muted?: boolean;
}> = ({ label, value, large, muted }) => (
  <div className={`flex justify-between ${large ? 'items-end' : ''}`}>
    <span className="text-blue-50 text-sm">{label}</span>
    <span
      className={`font-${large ? 'bold' : 'semibold'} ${
        large ? 'text-3xl' : muted ? 'text-2xl text-blue-200' : 'text-sm'
      }`}
    >
      {formatCurrency(value, '$')}
    </span>
  </div>
);

const Divider: React.FC = () => <div className="border-t border-blue-400" />;
