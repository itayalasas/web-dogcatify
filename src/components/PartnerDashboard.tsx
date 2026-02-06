import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  Calendar,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  MapPin,
  MessageSquare,
  Settings,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';
import MyBookings from './partner/MyBookings';
import MyServices from './partner/MyServices';
import MyReviews from './partner/MyReviews';
import ManualBooking from './partner/ManualBooking';

const PartnerDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { id: 'overview', label: 'Vista General', icon: TrendingUp },
    { id: 'appointments', label: 'Mis Citas', icon: Calendar },
    { id: 'new-appointment', label: 'Agendar Cita', icon: Clock },
    { id: 'services', label: 'Mis Servicios', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'reviews', label: 'Reseñas', icon: Star },
    { id: 'schedule', label: 'Horarios', icon: Clock },
    { id: 'location', label: 'Mi Ubicación', icon: MapPin },
    { id: 'earnings', label: 'Ganancias', icon: DollarSign },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-gradient-to-b from-teal-600 to-cyan-700 min-h-screen fixed left-0 top-0">
          <div className="p-6 border-b border-teal-500">
            <div className="flex items-center space-x-3">
              <img src="/logo-transp.png" alt="DogCatify" className="h-10 w-10 bg-white rounded-lg p-1" />
              <div>
                <h1 className="text-white font-bold text-xl">DogCatify</h1>
                <p className="text-teal-100 text-xs">Panel de Aliado</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
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
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-500">
            <div className="bg-teal-700 rounded-lg p-3 mb-3">
              <p className="text-teal-100 text-xs mb-1">Bienvenido:</p>
              <p className="text-white text-sm font-medium">{profile?.display_name || 'Aliado'}</p>
              <p className="text-teal-200 text-xs truncate">{user?.email}</p>
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
                Gestiona tu negocio y servicios en la plataforma DogCatify
              </p>
            </div>

            {activeSection === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-blue-600 text-sm font-medium">Hoy</span>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Citas Pendientes</h3>
                    <p className="text-3xl font-bold text-gray-800">8</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-yellow-100 p-3 rounded-lg">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                      <span className="text-yellow-600 text-sm font-medium">★ 4.8</span>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Calificación</h3>
                    <p className="text-3xl font-bold text-gray-800">127</p>
                    <p className="text-xs text-gray-500">reseñas</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-green-600 text-sm font-medium">+18%</span>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Ingresos del Mes</h3>
                    <p className="text-3xl font-bold text-gray-800">$3,240</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <span className="text-purple-600 text-sm font-medium">Activos</span>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">Clientes</h3>
                    <p className="text-3xl font-bold text-gray-800">284</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximas Citas</h3>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="bg-teal-100 p-2 rounded-lg">
                            <Calendar className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">Consulta Veterinaria</p>
                            <p className="text-sm text-gray-600">Cliente #{i} - 10:00 AM</p>
                          </div>
                          <button className="text-teal-600 hover:text-teal-700 font-medium text-sm">
                            Ver
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Reseñas Recientes</h3>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-800">Cliente #{i}</p>
                            <div className="flex items-center text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="ml-1 text-sm">5.0</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Excelente servicio, muy profesional y cuidadoso con mi mascota.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'appointments' && <MyBookings />}
            {activeSection === 'new-appointment' && <ManualBooking onBookingCreated={() => setActiveSection('appointments')} />}
            {activeSection === 'services' && <MyServices />}
            {activeSection === 'reviews' && <MyReviews />}

            {!['overview', 'appointments', 'new-appointment', 'services', 'reviews'].includes(activeSection) && (
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboard;
