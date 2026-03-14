import React from 'react';

interface MainContentProps {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  headerControls?: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({
  title,
  children,
  headerAction,
  headerControls,
}) => {
  return (
    <div className="app-shell">
      <div className="page-content">
        <header className="page-header">
          <h2 className="page-title">{title}</h2>
          {headerControls || headerAction ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {headerControls}
              {headerAction}
            </div>
          ) : null}
        </header>

        <div className="animate-fadeIn">{children}</div>
      </div>
    </div>
  );
};
