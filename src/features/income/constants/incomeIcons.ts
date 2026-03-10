/**
 * Income type icon mappings
 * Associates income types and frequencies with visual icons
 */

import type { IconType } from 'react-icons';
import {
  LuCalendarClock,
  LuCalendarCheck,
  LuCalendar,
  LuCalendarDays,
  LuCircleDollarSign,
} from 'react-icons/lu';

import type { IncomeType, IncomeFrequency } from '../types/income';

// Icon colors for different income types
export const INCOME_ICON_COLORS = {
  regular: 'text-green-600',
  bonus: 'text-blue-600',
} as const;

// Icon mappings for regular income
export const REGULAR_INCOME_ICON: IconType = LuCalendarClock;

// Icon mappings for bonus income by frequency
export const BONUS_INCOME_ICONS: Record<
  IncomeFrequency | 'one-time',
  IconType
> = {
  annual: LuCalendarCheck,
  quarterly: LuCalendar,
  monthly: LuCalendarDays,
  'one-time': LuCircleDollarSign,
};

/**
 * Get icon for income type and frequency
 * Returns appropriate icon and color for rendering
 */
export function getIncomeIcon(
  type: IncomeType,
  frequency?: IncomeFrequency,
): {
  icon: IconType;
  color: string;
  label: string;
} {
  if (type === 'regular') {
    return {
      icon: REGULAR_INCOME_ICON,
      color: INCOME_ICON_COLORS.regular,
      label: 'Regular income stream',
    };
  }

  const freq = frequency || 'one-time';
  return {
    icon: BONUS_INCOME_ICONS[freq],
    color: INCOME_ICON_COLORS.bonus,
    label: `Bonus income (${freq})`,
  };
}
