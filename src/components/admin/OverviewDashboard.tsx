import React, { useState, useEffect } from 'react';
import {
  Users,
  Store,
  PawPrint,
  DollarSign,
  ShoppingCart,
  Calendar,
  MapPin,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
} from 'lucide-react';
import { dashboardService, DashboardStats, ChartData } from '../../services/dashboard.service';

interface LineChartProps {
  data: ChartData[];
  color: string;
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, color, height = 120 }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Sin datos
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const padding = 10;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - (d.value / maxValue) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <polygon
          points={areaPoints}
          fill={`url(#gradient-${color})`}
        />

        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
          const y = height - (d.value / maxValue) * (height - padding * 2) - padding;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          );
        })}
      </svg>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

const OverviewDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartData[]>([]);
  const [ordersChart, setOrdersChart] = useState<ChartData[]>([]);
  const [usersChart, setUsersChart] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, revenueData, ordersData, usersData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRevenueChart(30),
        dashboardService.getOrdersChart(30),
        dashboardService.getUsersChart(30),
      ]);

      setStats(statsData);
      setRevenueChart(revenueData);
      setOrdersChart(ordersData);
      setUsersChart(usersData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-UY').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Error al cargar estadísticas</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Usuarios',
      value: formatNumber(stats.totalUsers),
      growth: stats.usersGrowth,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Aliados Activos',
      value: formatNumber(stats.activePartners),
      growth: stats.partnersGrowth,
      icon: Store,
      color: 'teal',
      bgColor: 'bg-teal-100',
      textColor: 'text-teal-600',
    },
    {
      title: 'Mascotas Registradas',
      value: formatNumber(stats.totalPets),
      growth: stats.petsGrowth,
      icon: PawPrint,
      color: 'violet',
      bgColor: 'bg-violet-100',
      textColor: 'text-violet-600',
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(stats.monthlyRevenue),
      growth: stats.revenueGrowth,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
  ];

  const secondaryCards = [
    {
      title: 'Pedidos Totales',
      value: formatNumber(stats.totalOrders),
      growth: stats.ordersGrowth,
      icon: ShoppingCart,
      color: 'orange',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
    },
    {
      title: 'Citas Pendientes',
      value: formatNumber(stats.pendingAppointments),
      icon: Calendar,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Lugares Registrados',
      value: formatNumber(stats.totalPlaces),
      icon: MapPin,
      color: 'pink',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-600',
    },
    {
      title: 'Promociones Activas',
      value: formatNumber(stats.activePromotions),
      icon: Megaphone,
      color: 'cyan',
      bgColor: 'bg-cyan-100',
      textColor: 'text-cyan-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.growth >= 0;

          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{card.growth}%
                  </span>
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Ingresos (Últimos 30 días)</h3>
              <p className="text-sm text-gray-500 mt-1">Evolución de ingresos por pedidos pagados</p>
            </div>
            <div className="flex items-center gap-2 text-teal-600">
              <Activity className="h-5 w-5" />
              <span className="text-sm font-medium">Activo</span>
            </div>
          </div>
          <LineChart data={revenueChart} color="#0d9488" height={200} />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Promedio Diario</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(revenueChart.reduce((sum, d) => sum + d.value, 0) / Math.max(revenueChart.length, 1))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Día Pico</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(Math.max(...revenueChart.map(d => d.value), 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Período</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(revenueChart.reduce((sum, d) => sum + d.value, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Métricas Rápidas</h3>
          <div className="space-y-4">
            {secondaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`${card.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${card.textColor}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{card.title}</p>
                      <p className="text-lg font-bold text-gray-800">{card.value}</p>
                    </div>
                  </div>
                  {card.growth !== undefined && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      card.growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {card.growth >= 0 ? '+' : ''}{card.growth}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Pedidos (Últimos 30 días)</h3>
            <ShoppingCart className="h-5 w-5 text-orange-600" />
          </div>
          <LineChart data={ordersChart} color="#f97316" height={150} />
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Total Período</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(ordersChart.reduce((sum, d) => sum + d.value, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Promedio Diario</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(Math.round(ordersChart.reduce((sum, d) => sum + d.value, 0) / Math.max(ordersChart.length, 1)))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Nuevos Usuarios (Últimos 30 días)</h3>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <LineChart data={usersChart} color="#3b82f6" height={150} />
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Total Período</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(usersChart.reduce((sum, d) => sum + d.value, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Promedio Diario</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(Math.round(usersChart.reduce((sum, d) => sum + d.value, 0) / Math.max(usersChart.length, 1)))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Resumen de Citas</h3>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">Total Período</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(stats.pendingAppointments + stats.completedAppointments)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Promedio Diario</p>
              <p className="text-lg font-bold text-gray-800">
                {formatNumber(Math.round((stats.pendingAppointments + stats.completedAppointments) / 30))}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-teal-600" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium mb-1">Citas Pendientes</p>
                <p className="text-3xl font-bold text-yellow-800">{formatNumber(stats.pendingAppointments)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-2">Requieren confirmación o atención</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium mb-1">Citas Completadas</p>
                <p className="text-3xl font-bold text-green-800">{formatNumber(stats.completedAppointments)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">Servicios finalizados exitosamente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
