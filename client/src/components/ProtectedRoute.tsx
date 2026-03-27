import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'teacher' | 'admin';
}

/**
 * Route guard component that:
 * 1. Redirects unauthenticated users to /login
 * 2. Redirects users with incomplete onboarding to /onboarding
 * 3. Redirects users with the wrong role to their appropriate dashboard
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // 1. Unauthenticated -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Incomplete Onboarding -> Onboarding Page
  if (user && !user.onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. User already completed onboarding but trying to access onboarding page
  if (user && user.onboardingComplete && location.pathname === '/onboarding') {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  // 4. Wrong role access protection
  if (role && user && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
