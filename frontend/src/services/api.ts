import { AuthResponse } from '../types/auth';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
const TOKEN_STORAGE_KEY = 'devtrack_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Ignore storage errors in restricted environments
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
};

export const api = {
  getGithubAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/github`;
  },

  async getCurrentUser(): Promise<AuthResponse> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, authenticated: false, error: 'Not authenticated' };
        }
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          authenticated: false,
          error: errData.error || `HTTP ${res.status}: Failed to fetch user`
        };
      }

      const data = await res.json();
      return {
        success: true,
        authenticated: Boolean(data.authenticated),
        user: data.user,
      };
    } catch (err: any) {
      return {
        success: false,
        authenticated: false,
        error: err.message || 'Network error connecting to backend API',
      };
    }
  },

  async logout(): Promise<AuthResponse> {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      tokenStorage.remove();

      if (!res.ok) {
        return { success: false, authenticated: false, message: 'Logged out locally' };
      }

      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        authenticated: false,
        message: data.message || 'Logged out successfully',
      };
    } catch {
      tokenStorage.remove();
      return { success: true, authenticated: false, message: 'Logged out' };
    }
  }
};
