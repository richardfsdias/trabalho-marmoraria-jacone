// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token'); // Verifica se o token existe
  return token ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;