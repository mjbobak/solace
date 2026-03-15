import { statusPalette } from '@/shared/theme';

interface SummaryCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}

export function SummaryCard({
  label,
  value,
  variant = 'default',
}: SummaryCardProps) {
  const getVariantClasses = (v: string) => {
    switch (v) {
      case 'positive':
        return statusPalette.income;
      case 'negative':
        return statusPalette.spending;
      case 'warning':
        return statusPalette.budget;
      default:
        return 'var(--color-text)';
    }
  };

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className="text-2xl font-bold"
        style={{ color: getVariantClasses(variant) }}
      >
        {value}
      </p>
    </div>
  );
}
