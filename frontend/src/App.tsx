import React, { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';
import { AuthErrorScreen } from './components/auth/AuthErrorScreen';
import { MinimalDashboard } from './components/dashboard/MinimalDashboard';
import { DevTrackLanding } from './ReferenceDevTrackLanding';

const MainRouter: React.FC = () => {
  const { loading, isAuthenticated, error, loginWithGithub, clearError } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  const hasAuthParams =
    window.location.search.includes('auth=') || window.location.search.includes('token=');

  if (loading && (currentPath === '/dashboard' || hasAuthParams)) {
    return <AuthLoadingScreen message="Connecting with GitHub..." />;
  }

  if (error) {
    return (
      <AuthErrorScreen
        error={error}
        onRetry={loginWithGithub}
        onBackHome={() => {
          clearError();
          navigateTo('/');
        }}
      />
    );
  }

  if (currentPath === '/dashboard') {
    if (!isAuthenticated && !loading) {
      window.history.replaceState({}, '', '/');
      return <DevTrackLanding onNavigateToDashboard={() => navigateTo('/dashboard')} />;
    }
    return <MinimalDashboard />;
  }

  return <DevTrackLanding onNavigateToDashboard={() => navigateTo('/dashboard')} />;
};

export const App: React.FC = () => (
  <AuthProvider>
    <MainRouter />
  </AuthProvider>
);

export default App;
