import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — wraps dashboard routes.
 * Redirects to /login if unauthenticated.
 * Optionally restricts by role via `allowedRoles` prop.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Still checking session — show spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#040d1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but role not allowed
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
