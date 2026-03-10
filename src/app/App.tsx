import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import AppRoutes from '@/app/Routes';
import { AuthProvider } from '@/features/auth';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={3500}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
