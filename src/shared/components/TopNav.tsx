import React, { useEffect, useState } from 'react';
import { TbHomeStats } from 'react-icons/tb';

export type TabType = 'dashboard' | 'income' | 'spending' | 'budget';

interface TopNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface NavItem {
  id: TabType;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'income', label: 'Income' },
  { id: 'spending', label: 'Spending' },
  { id: 'budget', label: 'Budget' },
];

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onTabChange }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 text-gray-900 flex items-center gap-8 px-6 transition-all duration-200 ${
        isScrolled
          ? 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50'
          : 'bg-transparent'
      }`}
    >
      {/* Logo/Brand Section */}
      <div className="flex items-center gap-2">
        <TbHomeStats className="w-6 h-6" />
        <h1 className="text-xl font-bold tracking-wide">Solace.</h1>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                h-10 px-2 flex items-center
                transition-all duration-200
                border-b-4
                ${
                  isActive
                    ? 'border-gray-900/80'
                    : 'border-transparent hover:border-gray-900/30'
                }
              `}
            >
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
