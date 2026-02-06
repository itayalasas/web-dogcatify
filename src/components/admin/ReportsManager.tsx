import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, Store, PawPrint, ShoppingCart, Calendar, DollarSign, BarChart3 } from 'lucide-react';

const ReportsManager = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    totalPartners: 0,
    totalOrders: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    avgOrderValue: 0,
    topPartner: null as any,
    recentGrowth: {
      users: 0,
      orders: 0,
      bookings: 0
    }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [
        usersResult,
        petsResult,
        partnersResult,
        ordersResult,
        bookingsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at'),
        supabase.from('pets').select('id'),
        supabase.from('partners').select('id, business_name, is_active'),
        supabase.from('orders').select('id, total_amount, commission_amount, created_at, payment_status'),
        supabase.from('bookings').select('id, total_amount, commission_amount, created_at, partner_id')
      ]);

      const users = usersResult.data || [];
      const pets = petsResult.data || [];
      const partners = partnersResult.data || [];
      const orders = ordersResult.data || [];
      const bookings = bookingsResult.data || [];

      const approvedOrders = orders.filter(o => o.payment_status === 'approved');
      const totalRevenue = approvedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalCommissions = approvedOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
      const avgOrderValue = approvedOrders.length > 0 ? totalRevenue / approvedOrders.length : 0;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const recentUsers = users.filter(u => new Date(u.created_at) > lastMonth).length;
      const recentOrders = orders.filter(o => new Date(o.created_at) > lastMonth).length;
      const recentBookings = bookings.filter(b => new Date(b.created_at) > lastMonth).length;

      const partnerBookings: Record<string, number> = {};
      bookings.forEach(b => {
        if (b.partner_id) {
          partnerBookings[b.partner_id] = (partnerBookings[b.partner_id] || 0) + 1;
        }
      });

      const topPartnerId = Object.keys(partnerBookings).reduce((a, b) =>
        partnerBookings[a] > partnerBookings[b] ? a : b, Object.keys(partnerBookings)[0]
      );

      const topPartner = partners.find(p => p.id === topPartnerId);

      setStats({
        totalUsers: users.length,
        totalPets: pets.length,
        totalPartners: partners.filter(p => p.is_active).length,
        totalOrders: orders.length,
        totalBookings: bookings.length,
        totalRevenue,
        totalCommissions,
        avgOrderValue,
        topPartner,
        recentGrowth: {
          users: recentUsers,
          orders: recentOrders,
          bookings: recentBookings
        }
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando reportes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">+{stats.recentGrowth.users}</span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Usuarios</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <PawPrint className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Mascotas</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalPets}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-100 p-3 rounded-lg">
                <Store className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Partners Activos</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalPartners}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Ingresos Totales</h3>
            <p className="text-3xl font-bold text-gray-800">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Métricas de Ventas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-amber-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">+{stats.recentGrowth.orders}</span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Pedidos</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">+{stats.recentGrowth.bookings}</span>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Citas</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalBookings}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Valor Promedio Pedido</h3>
            <p className="text-3xl font-bold text-gray-800">${stats.avgOrderValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Financiera</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Comisiones Generadas</h3>
            <p className="text-3xl font-bold text-teal-600">${stats.totalCommissions.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">
              {((stats.totalCommissions / stats.totalRevenue) * 100 || 0).toFixed(1)}% del total
            </p>
          </div>

          {stats.topPartner && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">Partner Destacado</h3>
              <p className="text-xl font-bold text-gray-800">{stats.topPartner.business_name}</p>
              <p className="text-xs text-gray-500 mt-2">Con más reservas este mes</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Crecimiento Último Mes</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">+{stats.recentGrowth.users}</p>
            <p className="text-xs text-blue-700">Nuevos Usuarios</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">+{stats.recentGrowth.orders}</p>
            <p className="text-xs text-blue-700">Nuevos Pedidos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">+{stats.recentGrowth.bookings}</p>
            <p className="text-xs text-blue-700">Nuevas Citas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
