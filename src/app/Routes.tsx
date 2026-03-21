import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/features/auth';

// Lazy load route components for better code splitting
const PlanningShellPage = lazy(() => import('@/features/planning-shell'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="app-loader">
    <div className="spinner-ring" />
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PlanningShellPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/income"
          element={
            <ProtectedRoute>
              <PlanningShellPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/spending"
          element={
            <ProtectedRoute>
              <PlanningShellPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <PlanningShellPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
