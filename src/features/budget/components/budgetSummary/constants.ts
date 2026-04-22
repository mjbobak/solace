import type { Variants } from 'framer-motion';

import { budgetSummaryTheme } from '@/shared/theme';

export type SummaryView = 'chart' | 'numbers';

export const paletteBlue = budgetSummaryTheme.allocationBlue;
export const paletteBlueStrong = budgetSummaryTheme.allocationBlueStrong;
export const paletteOrange = budgetSummaryTheme.allocationOrange;
export const palettePurple = budgetSummaryTheme.allocationPurple;
export const palettePurpleText = budgetSummaryTheme.allocationPurpleText;
export const palettePurpleTextMuted =
  budgetSummaryTheme.allocationPurpleTextMuted;
export const compactCardContentHeight = 'min-h-[4rem]';
export const compactSummaryLabelClass =
  'mb-1 text-[11px] uppercase tracking-[0.12em] text-gray-500';
export const compactSummaryMetaClass =
  'text-[11px] uppercase tracking-[0.12em] text-gray-500';
export const pillValueTextClass = 'text-slate-800';
export const pillLabelTextClass = 'text-slate-600';
export const amountPillClassName =
  'inline-flex items-baseline gap-2 whitespace-nowrap rounded-lg bg-white/95 px-2.5 py-1 shadow-md ring-1 ring-slate-200/80';
export const cardIconContainerClass = budgetSummaryTheme.iconContainer;
export const cardIconClass = budgetSummaryTheme.icon;

export function formatWholeCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCardVariants(index: number): Variants {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
}

export function getBarTooltipContent(
  label: string,
  amount: number,
  amountContextLabelOrPercent: string | number,
  percentOfIncome?: number,
): string {
  if (typeof amountContextLabelOrPercent === 'string') {
    return `${label}\n${formatWholeCurrency(amount)} ${amountContextLabelOrPercent.toLowerCase()}\n${(percentOfIncome ?? 0).toFixed(1)}% of income`;
  }

  return `${label}\n${formatWholeCurrency(amount * 12)} annual\n${formatWholeCurrency(
    amount,
  )} monthly\n${amountContextLabelOrPercent.toFixed(1)}% of income`;
}
