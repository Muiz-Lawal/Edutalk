import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, requireHost = false }) {
  const { isAuthenticated, loading, isHost } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireHost && !isHost) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}