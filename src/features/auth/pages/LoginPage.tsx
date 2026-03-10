import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const fromLocation = (location.state as {
        from?: { pathname: string; search?: string };
      })?.from;
      const from = fromLocation
        ? `${fromLocation.pathname}${fromLocation.search || ''}`
        : '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
