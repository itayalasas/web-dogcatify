import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import PartnerDashboard from './PartnerDashboard';

const Dashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'partner') {
    return <PartnerDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso No Autorizado</h2>
        <p className="text-gray-600 mb-6">
          Tu cuenta no tiene permisos de administrador o aliado. Esta aplicación web es solo para gestión.
        </p>
        <p className="text-gray-600 mb-6">
          Si eres un usuario regular, por favor descarga nuestra aplicación móvil.
        </p>
        <a
          href="/"
          className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Volver al Inicio
        </a>
      </div>
    </div>
  );
};

export default Dashboard;
