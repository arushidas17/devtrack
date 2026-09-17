export interface User {
  id: string | number;
  githubId: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  githubUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  authenticated: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loginWithGithub: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}
