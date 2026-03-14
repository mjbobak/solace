import React, { useEffect, useState } from 'react';
import { LuMonitor, LuMoon, LuSunMedium } from 'react-icons/lu';
import { TbHomeStats } from 'react-icons/tb';

import { useTheme, type Theme } from '@/shared/theme';

export type TabType = 'dashboard' | 'income' | 'spending' | 'budget';

interface TopNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  rightContent?: React.ReactNode;
  showThemeToggle?: boolean;
}

interface NavItem {
  id: TabType;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'income', label: 'Income' },
  { id: 'budget', label: 'Budget' },
  { id: 'spending', label: 'Spending' },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  rightContent,
  showThemeToggle = true,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`app-nav ${isScrolled ? 'app-nav-scrolled' : ''}`}
    >
      <div className="app-nav-brand">
        <TbHomeStats className="w-6 h-6" />
        <h1 className="text-xl font-bold tracking-wide">Solace.</h1>
      </div>

      <div className="app-nav-links">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`app-nav-link ${isActive ? 'app-nav-link-active' : ''}`}
            >
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="app-nav-actions">
        {rightContent ? <div className="app-nav-right-content">{rightContent}</div> : null}
        {showThemeToggle ? (
          <div className="theme-toggle-group" aria-label="Theme mode selector">
            {([
              {
                value: 'light' as const,
                label: 'Light theme',
                icon: LuSunMedium,
              },
              {
                value: 'dark' as const,
                label: 'Dark theme',
                icon: LuMoon,
              },
              {
                value: 'system' as const,
                label: 'System theme',
                icon: LuMonitor,
              },
            ] satisfies Array<{
              value: Theme;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
            }>).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={`theme-toggle-button ${
                  theme === value ? 'theme-toggle-button-active' : ''
                }`}
                onClick={() => setTheme(value)}
                aria-label={label}
                aria-pressed={theme === value}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </nav>
  );
};
