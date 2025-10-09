import { useState, useEffect, useCallback } from 'react';
import { authService, AuthState, User } from '../lib/auth/AuthService';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(setAuthState);

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    return authService.login({ email, password });
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    return authService.logout();
  }, []);

  const getToken = useCallback((): string | null => {
    return authService.getToken();
  }, []);

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    getToken,
  };
}
