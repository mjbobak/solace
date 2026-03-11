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
    <div className="app-shell">
      <div className="page-content">
        <header className="page-header">
          <h2 className="page-title">{title}</h2>
          {headerAction}
        </header>

        <div className="animate-fadeIn">{children}</div>
      </div>
    </div>
  );
};
