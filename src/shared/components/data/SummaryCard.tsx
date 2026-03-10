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
        return 'text-emerald-600';
      case 'negative':
        return 'text-rose-600';
      case 'warning':
        return 'text-indigo-600';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div>
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold ${getVariantClasses(variant)}`}>
        {value}
      </p>
    </div>
  );
}
