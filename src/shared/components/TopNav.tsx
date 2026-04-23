import React, { useEffect, useRef, useState } from 'react';
import { LuCheck, LuMoon, LuSunMedium } from 'react-icons/lu';
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
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const scrollThreshold = 8;

    const handleScroll = () => {
      const nextIsScrolled = window.scrollY > scrollThreshold;
      setIsScrolled((currentIsScrolled) =>
        currentIsScrolled === nextIsScrolled
          ? currentIsScrolled
          : nextIsScrolled
      );
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isThemeMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isThemeMenuOpen]);

  const ThemeIcon = resolvedTheme === 'dark' ? LuMoon : LuSunMedium;

  return (
    <nav className={`app-nav ${isScrolled ? 'app-nav-scrolled' : ''}`}>
      <div className="app-nav-brand">
        {showThemeToggle ? (
          <div className="theme-menu" ref={themeMenuRef}>
            <button
              type="button"
              className={`theme-menu-trigger ${
                isThemeMenuOpen ? 'theme-menu-trigger-active' : ''
              }`}
              aria-label="Open theme menu"
              aria-expanded={isThemeMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsThemeMenuOpen((currentOpen) => !currentOpen)}
              title="Theme"
            >
              <ThemeIcon className="h-4 w-4" />
              <TbHomeStats className="h-5 w-5" />
            </button>

            {isThemeMenuOpen ? (
              <div className="theme-menu-popover" role="menu" aria-label="Theme menu">
                {(
                  [
                    {
                      value: 'light' as const,
                      label: 'Light mode',
                      icon: LuSunMedium,
                    },
                    {
                      value: 'dark' as const,
                      label: 'Dark mode',
                      icon: LuMoon,
                    },
                  ] satisfies Array<{
                    value: Extract<Theme, 'light' | 'dark'>;
                    label: string;
                    icon: React.ComponentType<{ className?: string }>;
                  }>
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={`theme-menu-item ${
                      resolvedTheme === value ? 'theme-menu-item-active' : ''
                    }`}
                    onClick={() => {
                      setTheme(value);
                      setIsThemeMenuOpen(false);
                    }}
                    role="menuitemradio"
                    aria-checked={resolvedTheme === value}
                  >
                    <span className="theme-menu-item-label">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </span>
                    {resolvedTheme === value ? <LuCheck className="h-4 w-4" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <TbHomeStats className="h-6 w-6" />
        )}
        <h1 className="text-xl font-bold tracking-wide">Solace.</h1>
      </div>

      <div className="app-nav-links">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`app-nav-link ${
                isActive ? 'app-nav-link-active' : ''
              }`}
            >
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="app-nav-actions">
        {rightContent ? (
          <div className="app-nav-right-content">{rightContent}</div>
        ) : null}
      </div>
    </nav>
  );
};
