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
    <div className="app-page-center">
      <div className="login-card">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
