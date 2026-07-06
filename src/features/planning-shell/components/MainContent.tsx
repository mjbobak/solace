import React from 'react';

interface MainContentProps {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  headerControls?: React.ReactNode;
  /** Locks the page to the viewport height; children handle their own scrolling. */
  fillViewport?: boolean;
}

export const MainContent: React.FC<MainContentProps> = ({
  title,
  children,
  headerAction,
  headerControls,
  fillViewport = false,
}) => {
  return (
    <div
      className={`app-shell ${fillViewport ? 'flex h-screen flex-col overflow-hidden' : ''}`}
    >
      <div
        className={`page-content ${fillViewport ? 'flex min-h-0 flex-1 flex-col' : ''}`}
      >
        <header className="page-header">
          <h2 className="page-title">{title}</h2>
          {/* Floating slot for contextual toolbars (e.g. bulk edit bar) portaled in by the active view. */}
          <div
            id="page-header-slot"
            className="relative flex min-w-0 flex-1 items-center justify-center"
          />
          {headerControls || headerAction ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {headerControls}
              {headerAction}
            </div>
          ) : null}
        </header>

        <div className={`animate-fadeIn ${fillViewport ? 'min-h-0 flex-1' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
