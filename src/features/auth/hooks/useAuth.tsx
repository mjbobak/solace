import { useAuthContext } from '../context/AuthContext';

/**
 * Hook for accessing authentication state and operations
 */
export function useAuth() {
  return useAuthContext();
}
