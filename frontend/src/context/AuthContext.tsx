import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthContextType } from '../types/auth';
import { api, tokenStorage } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);

    try {
      // 1. Inspect URL parameters for OAuth redirect callbacks or errors
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('token');
      const authStatus = params.get('auth');
      const authError = params.get('error');
      const errorMessage = params.get('message');

      if (authToken && authStatus === 'success') {
        tokenStorage.set(authToken);
        // Clean URL to keep it pretty and secure
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } else if (authError) {
        const readableError = errorMessage 
          ? decodeURIComponent(errorMessage) 
          : (authError === 'access_denied' 
              ? 'GitHub authorization was declined or cancelled.' 
              : `Authentication failed: ${authError}`);
        setError(readableError);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      // 2. Fetch authenticated user from backend session/token
      const result = await api.getCurrentUser();

      if (result.success && result.authenticated && result.user) {
        setUser(result.user);
        setError(null);
      } else {
        setUser(null);
        // Only keep explicit error from redirect, don't display generic 401 as error on initial load
      }
    } catch (err: any) {
      setUser(null);
      console.warn('Authentication check encountered an issue:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loginWithGithub = useCallback(() => {
    setLoading(true);
    setError(null);
    window.location.href = api.getGithubAuthUrl();
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setLoading(false);
      // Navigate to landing page if on dashboard
      if (window.location.pathname === '/dashboard') {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    error,
    loginWithGithub,
    logout,
    clearError,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
