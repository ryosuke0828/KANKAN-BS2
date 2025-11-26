import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // ユーザーが認証されていない場合、ログインページにリダイレクト
    return <Navigate to="/login" replace />;
  }

  // ユーザーが認証されている場合、子ルートをレンダリング
  return <Outlet />;
};

export default ProtectedRoute;
