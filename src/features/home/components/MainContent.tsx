import React from 'react';

interface MainContentProps {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({
  title,
  children,
  headerAction,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16">
      <div className="px-8 py-6">
        {/* Page Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {headerAction}
        </header>

        {/* Content Area */}
        <div className="animate-fadeIn">{children}</div>
      </div>
    </div>
  );
};
