import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalUsers: number;
  usersGrowth: number;
  activePartners: number;
  partnersGrowth: number;
  totalPets: number;
  petsGrowth: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalPlaces: number;
  activePromotions: number;
}

export interface ChartData {
  label: string;
  value: number;
  date?: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        { count: totalUsers },
        { count: usersThisMonth },
        { count: usersLastMonth },
        { count: activePartners },
        { count: partnersThisMonth },
        { count: partnersLastMonth },
        { count: totalPets },
        { count: petsThisMonth },
        { count: petsLastMonth },
        { data: ordersThisMonth },
        { data: ordersLastMonth },
        { count: totalOrders },
        { count: ordersGrowthCount },
        { count: pendingAppointments },
        { count: completedAppointments },
        { count: totalPlaces },
        { count: activePromotions },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', firstDayThisMonth.toISOString()),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()),
        supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', firstDayThisMonth.toISOString()),
        supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()),
        supabase.from('pets').select('*', { count: 'exact', head: true }),
        supabase.from('pets').select('*', { count: 'exact', head: true }).gte('created_at', firstDayThisMonth.toISOString()),
        supabase.from('pets').select('*', { count: 'exact', head: true }).gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()),
        supabase.from('orders').select('total_amount').eq('status', 'paid').gte('created_at', firstDayThisMonth.toISOString()),
        supabase.from('orders').select('total_amount').eq('status', 'paid').gte('created_at', firstDayLastMonth.toISOString()).lte('created_at', lastDayLastMonth.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', firstDayThisMonth.toISOString()),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('places').select('*', { count: 'exact', head: true }),
        supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const revenueThisMonth = ordersThisMonth?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const revenueLastMonth = ordersLastMonth?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      return {
        totalUsers: totalUsers || 0,
        usersGrowth: calculateGrowth(usersThisMonth || 0, usersLastMonth || 0),
        activePartners: activePartners || 0,
        partnersGrowth: calculateGrowth(partnersThisMonth || 0, partnersLastMonth || 0),
        totalPets: totalPets || 0,
        petsGrowth: calculateGrowth(petsThisMonth || 0, petsLastMonth || 0),
        monthlyRevenue: revenueThisMonth,
        revenueGrowth: calculateGrowth(revenueThisMonth, revenueLastMonth),
        totalOrders: totalOrders || 0,
        ordersGrowth: calculateGrowth(ordersGrowthCount || 0, (ordersLastMonth?.length || 0)),
        pendingAppointments: pendingAppointments || 0,
        completedAppointments: completedAppointments || 0,
        totalPlaces: totalPlaces || 0,
        activePromotions: activePromotions || 0,
      };
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      return {
        totalUsers: 0,
        usersGrowth: 0,
        activePartners: 0,
        partnersGrowth: 0,
        totalPets: 0,
        petsGrowth: 0,
        monthlyRevenue: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        ordersGrowth: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalPlaces: 0,
        activePromotions: 0,
      };
    }
  },

  async getRevenueChart(days: number = 30): Promise<ChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyRevenue = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyRevenue.set(dateStr, 0);
      }

      orders?.forEach((order) => {
        const dateStr = order.created_at.split('T')[0];
        const current = dailyRevenue.get(dateStr) || 0;
        dailyRevenue.set(dateStr, current + (order.total_amount || 0));
      });

      return Array.from(dailyRevenue.entries()).map(([date, value]) => ({
        label: new Date(date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }),
        value: Math.round(value),
        date,
      }));
    } catch (error) {
      console.error('Error loading revenue chart:', error);
      return [];
    }
  },

  async getOrdersChart(days: number = 30): Promise<ChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyOrders = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyOrders.set(dateStr, 0);
      }

      orders?.forEach((order) => {
        const dateStr = order.created_at.split('T')[0];
        const current = dailyOrders.get(dateStr) || 0;
        dailyOrders.set(dateStr, current + 1);
      });

      return Array.from(dailyOrders.entries()).map(([date, value]) => ({
        label: new Date(date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }),
        value,
        date,
      }));
    } catch (error) {
      console.error('Error loading orders chart:', error);
      return [];
    }
  },

  async getUsersChart(days: number = 30): Promise<ChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: users, error } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const dailyUsers = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyUsers.set(dateStr, 0);
      }

      users?.forEach((user) => {
        const dateStr = user.created_at.split('T')[0];
        const current = dailyUsers.get(dateStr) || 0;
        dailyUsers.set(dateStr, current + 1);
      });

      return Array.from(dailyUsers.entries()).map(([date, value]) => ({
        label: new Date(date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' }),
        value,
        date,
      }));
    } catch (error) {
      console.error('Error loading users chart:', error);
      return [];
    }
  },

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('id, action, resource_type, user_email, created_at, details')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return logs?.map((log) => ({
        id: log.id,
        type: log.action,
        description: `${log.action.replace(/_/g, ' ')} - ${log.resource_type || 'Sistema'}`,
        timestamp: log.created_at,
        user: log.user_email,
      })) || [];
    } catch (error) {
      console.error('Error loading recent activity:', error);
      return [];
    }
  },

  async getTopServices(limit: number = 5): Promise<ChartData[]> {
    try {
      const { data: services, error } = await supabase
        .from('partner_services')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const serviceCount = new Map<string, number>();
      services?.forEach((service) => {
        const name = service.name || 'Sin nombre';
        serviceCount.set(name, (serviceCount.get(name) || 0) + 1);
      });

      return Array.from(serviceCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, value]) => ({ label, value }));
    } catch (error) {
      console.error('Error loading top services:', error);
      return [];
    }
  },
};
