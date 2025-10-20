/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Manages JWT tokens, user session, and authentication state.
 *
 * Features:
 * - Login/logout functionality
 * - Token management with httpOnly cookies
 * - User session persistence
 * - Loading and error states
 * - Automatic token refresh
 *
 * Usage:
 * ```tsx
 * import { useAuth } from '@/lib/auth/auth-context';
 *
 * function MyComponent() {
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <p>Welcome {user?.name}</p>
 *       ) : (
 *         <button onClick={() => login(email, password)}>Login</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// User type matching backend response
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  phone?: string;
  roleId: string;
  status: string;
  // Computed field for display
  name?: string;
  // For permission checks (to be added later)
  roles?: string[];
  permissions?: string[];
}

// Authentication context state
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication context.
 * Manages JWT tokens via httpOnly cookies for security.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  /**
   * Fetch current user from session
   * Uses /api/auth/me endpoint that reads httpOnly cookie
   */
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include httpOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        // Compute name field from firstName + lastName
        const user = {
          ...data.user,
          name: `${data.user.firstName} ${data.user.lastName}`.trim(),
        };
        setUser(user);
      } else if (response.status === 401) {
        // Not authenticated
        setUser(null);
      } else {
        throw new Error('Failed to fetch user session');
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with email and password
   * Stores JWT in httpOnly cookie via API route
   * Also stores in localStorage for Apollo Client compatibility
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();

      // Compute name field from firstName + lastName
      const user = {
        ...data.user,
        name: `${data.user.firstName} ${data.user.lastName}`.trim(),
      };

      setUser(user);

      // Store token in localStorage for Apollo Client compatibility
      if (data.accessToken) {
        localStorage.setItem('authToken', data.accessToken);
      }

      // Store organization ID for multi-tenancy (using organizationId as tenant)
      if (data.user?.organizationId) {
        localStorage.setItem('tenantId', data.user.organizationId);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user and clear session
   * Removes httpOnly cookie via API route and clears localStorage
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('tenantId');

      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 *
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
