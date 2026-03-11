import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import AppRoutes from '@/app/Routes';
import { AuthProvider } from '@/features/auth';
import { ThemeProvider, useTheme } from '@/shared/theme';

const AppContent: React.FC = () => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        duration={3500}
        theme={resolvedTheme}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
