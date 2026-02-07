import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../services/audit.service';
import {
  LogOut,
  Users,
  Store,
  Package,
  ShoppingCart,
  Calendar,
  MapPin,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  FileText,
  Shield,
  PawPrint,
  Megaphone,
} from 'lucide-react';
import PromotionsManager from './admin/PromotionsManager';
import PlacesManager from './admin/PlacesManager';
import PartnersManager from './admin/PartnersManager';
import SettingsManager from './admin/SettingsManager';
import UsersManager from './admin/UsersManager';
import PetsManager from './admin/PetsManager';
import OrdersManager from './admin/OrdersManager';
import BookingsManager from './admin/BookingsManager';
import ProductsManager from './admin/ProductsManager';
import PaymentsManager from './admin/PaymentsManager';
import ReportsManager from './admin/ReportsManager';
import NotificationsManager from './admin/NotificationsManager';
import SecurityManager from './admin/SecurityManager';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    logAction('ADMIN_ACCESS', { section: 'dashboard' });
  }, []);

  useEffect(() => {
    if (activeSection !== 'overview') {
      logAction('ADMIN_SECTION_VIEW', { section: activeSection });
    }
  }, [activeSection]);

  const handleSignOut = async () => {
    logAction('LOGOUT', { from: 'admin_dashboard' });
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Vista General', icon: BarChart3 },
    { id: 'promotions', label: 'Promociones', icon: Megaphone },
    { id: 'places', label: 'Lugares Pet-Friendly', icon: MapPin },
    { id: 'partners', label: 'Aliados', icon: Store },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'pets', label: 'Mascotas', icon: PawPrint },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'appointments', label: 'Citas', icon: Calendar },
    { id: 'payments', label: 'Pagos', icon: DollarSign },
    { id: 'reports', label: 'Reportes', icon: FileText },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-green-600 text-sm font-medium">+12%</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Total Usuarios</h3>
              <p className="text-3xl font-bold text-gray-800">15,847</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <Store className="h-6 w-6 text-teal-600" />
                </div>
                <span className="text-green-600 text-sm font-medium">+8%</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Aliados Activos</h3>
              <p className="text-3xl font-bold text-gray-800">342</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <PawPrint className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-green-600 text-sm font-medium">+15%</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Mascotas Registradas</h3>
              <p className="text-3xl font-bold text-gray-800">23,456</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-green-600 text-sm font-medium">+23%</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Ingresos Mensuales</h3>
              <p className="text-3xl font-bold text-gray-800">$45,892</p>
            </div>
          </div>
        );

      case 'promotions':
        return <PromotionsManager />;

      case 'places':
        return <PlacesManager />;

      case 'partners':
        return <PartnersManager />;

      case 'users':
        return <UsersManager />;

      case 'pets':
        return <PetsManager />;

      case 'products':
        return <ProductsManager />;

      case 'orders':
        return <OrdersManager />;

      case 'appointments':
        return <BookingsManager />;

      case 'payments':
        return <PaymentsManager />;

      case 'reports':
        return <ReportsManager />;

      case 'notifications':
        return <NotificationsManager />;

      case 'security':
        return <SecurityManager />;

      case 'settings':
        return <SettingsManager />;

      default:
        return (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                {React.createElement(
                  menuItems.find((item) => item.id === activeSection)?.icon || Settings,
                  { className: 'h-10 w-10 text-gray-400' }
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Sección en Desarrollo
              </h3>
              <p className="text-gray-600">
                Esta funcionalidad se conectará con las tablas de la base de datos existente.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-gradient-to-b from-teal-600 to-cyan-700 min-h-screen fixed left-0 top-0">
          <div className="p-6 border-b border-teal-500">
            <div className="flex items-center space-x-3">
              <img src="/logo-transp.png" alt="DogCatify" className="h-10 w-10 bg-white rounded-lg p-1" />
              <div>
                <h1 className="text-white font-bold text-xl">DogCatify</h1>
                <p className="text-teal-100 text-xs">Panel Administrador</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? 'bg-white text-teal-600'
                      : 'text-white hover:bg-teal-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-500">
            <div className="bg-teal-700 rounded-lg p-3 mb-3">
              <p className="text-teal-100 text-xs mb-1">Sesión iniciada como:</p>
              <p className="text-white text-sm font-medium truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        <main className="ml-64 flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {menuItems.find((item) => item.id === activeSection)?.label}
              </h2>
              <p className="text-gray-600">
                Gestiona y supervisa toda la plataforma DogCatify
              </p>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
