/**
 * Protected Route Wrapper
 *
 * Wraps pages that require authentication. Redirects to login if user is not authenticated.
 * Shows loading state while checking authentication status.
 *
 * Usage:
 * ```tsx
 * import { ProtectedRoute } from '@/components/auth/protected-route';
 *
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute>
 *       <div>Protected content here</div>
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredPermissions?: string[];
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Not authenticated, redirect to login
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  // Check permissions if required
  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every((permission) =>
        user?.permissions?.includes(permission) ?? false
      );

      if (!hasPermission) {
        // User doesn't have required permissions
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, requiredPermissions, user, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated, show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.every((permission) =>
      user?.permissions?.includes(permission) ?? false
    );

    if (!hasPermission) {
      return null; // Will redirect via useEffect
    }
  }

  // Authenticated and authorized, show protected content
  return <>{children}</>;
}

/**
 * Higher-order component version for more explicit usage
 *
 * Usage:
 * ```tsx
 * const ProtectedDashboard = withAuth(DashboardPage, {
 *   requiredPermissions: ['dashboard:view']
 * });
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
