import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { TopNav } from '@/shared/components/TopNav';
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from '@/shared/theme';

function installMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      get matches() {
        return matches;
      },
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: (
        _event: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        listeners.add(listener);
      },
      removeEventListener: (
        _event: string,
        listener: (event: MediaQueryListEvent) => void,
      ) => {
        listeners.delete(listener);
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: vi.fn(),
    })),
  });

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = {
        matches: nextMatches,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

const ThemeProbe = () => {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span>{`theme:${theme}`}</span>
      <span>{`resolved:${resolvedTheme}`}</span>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        clear: vi.fn(() => {
          storage.clear();
        }),
      },
    });
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('defaults to system and applies the current light theme', () => {
    installMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('theme:system')).toBeInTheDocument();
    expect(screen.getByText('resolved:light')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('restores a persisted explicit theme', () => {
    installMatchMedia(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('theme:dark')).toBeInTheDocument();
    expect(screen.getByText('resolved:dark')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('reacts to system theme changes while the preference is system', () => {
    const mediaController = installMatchMedia(false);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    act(() => {
      mediaController.setMatches(true);
    });

    expect(screen.getByText('resolved:dark')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('updates the theme through the top-nav toggle and persists the choice', () => {
    installMatchMedia(false);

    render(
      <ThemeProvider>
        <TopNav activeTab="dashboard" onTabChange={vi.fn()} />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open theme menu' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark mode' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('can render custom nav content without the theme toggle', () => {
    installMatchMedia(false);

    render(
      <ThemeProvider>
        <TopNav
          activeTab="dashboard"
          onTabChange={vi.fn()}
          rightContent={<div>Planning filters</div>}
          showThemeToggle={false}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Planning filters')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open theme menu' }),
    ).not.toBeInTheDocument();
  });
});
