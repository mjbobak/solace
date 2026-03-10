import React, { useState } from 'react';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

import { useAuth } from '../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username, password });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to access your finance dashboard
        </p>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
          autoComplete="username"
          autoFocus
        />

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        disabled={!username || !password}
        className="w-full"
      >
        Sign In
      </Button>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Development credentials:</p>
        <p className="font-mono">admin / admin123</p>
      </div>
    </form>
  );
};
