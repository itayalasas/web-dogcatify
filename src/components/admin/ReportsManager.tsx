import { useEffect, useState, type ReactNode } from 'react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  PawPrint,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isPartnerSubscriptionCurrent } from '../../utils/partnerPlans';

type JoinedPlan = {
  price_monthly?: number | null;
  price_yearly?: number | null;
  currency?: string | null;
};

const getJoinedPlan = (value: JoinedPlan | JoinedPlan[] | null | undefined) =>
  Array.isArray(value) ? value[0] || null : value || null;

const isPaid = (status?: string | null) =>
  ['approved', 'paid', 'completed'].includes(String(status || '').toLowerCase());

const ReportsManager = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    totalPartners: 0,
    totalOrders: 0,
    totalBookings: 0,
    salesVolume: 0,
    subscriptionMrr: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    avgOrderValue: 0,
    topPartner: null as { business_name?: string | null } | null,
    recentGrowth: {
      users: 0,
      orders: 0,
      bookings: 0,
    },
  });

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [
        usersResult,
        petsResult,
        partnersResult,
        ordersResult,
        bookingsResult,
        subscriptionsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at'),
        supabase.from('pets').select('id'),
        supabase.from('partners').select('id, business_name, is_active'),
        supabase.from('orders').select('id, total_amount, created_at, payment_status'),
        supabase.from('bookings').select('id, total_amount, created_at, partner_id'),
        supabase
          .from('partner_subscriptions')
          .select(
            'id, partner_id, status, billing_cycle, expires_at, trial_ends_at, subscription_plans ( price_monthly, price_yearly, currency )',
          ),
      ]);

      const failed = [
        usersResult,
        petsResult,
        partnersResult,
        ordersResult,
        bookingsResult,
        subscriptionsResult,
      ].find((result) => result.error);
      if (failed?.error) throw failed.error;

      const users = usersResult.data || [];
      const pets = petsResult.data || [];
      const partners = partnersResult.data || [];
      const orders = ordersResult.data || [];
      const bookings = bookingsResult.data || [];
      const subscriptions = subscriptionsResult.data || [];

      const paidOrders = orders.filter((order) => isPaid(order.payment_status));
      const salesVolume = paidOrders.reduce(
        (sum, order) => sum + (Number(order.total_amount) || 0),
        0,
      );
      const avgOrderValue = paidOrders.length > 0 ? salesVolume / paidOrders.length : 0;

      const currentSubscriptions = subscriptions.filter((subscription) =>
        isPartnerSubscriptionCurrent(
          subscription.status,
          subscription.expires_at || subscription.trial_ends_at,
        ),
      );
      const activeSubscriptions = currentSubscriptions.filter(
        (subscription) => String(subscription.status).toLowerCase() === 'active',
      );
      const trialSubscriptions = currentSubscriptions.filter(
        (subscription) => String(subscription.status).toLowerCase() === 'trialing',
      ).length;
      const subscriptionMrr = activeSubscriptions.reduce((sum, subscription) => {
        const plan = getJoinedPlan(subscription.subscription_plans as JoinedPlan | JoinedPlan[]);
        const amount =
          subscription.billing_cycle === 'yearly'
            ? (Number(plan?.price_yearly) || 0) / 12
            : Number(plan?.price_monthly) || 0;
        return sum + amount;
      }, 0);

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const recentUsers = users.filter((user) => new Date(user.created_at) > lastMonth).length;
      const recentOrders = orders.filter((order) => new Date(order.created_at) > lastMonth).length;
      const recentBookings = bookings.filter(
        (booking) => new Date(booking.created_at) > lastMonth,
      ).length;

      const partnerBookings: Record<string, number> = {};
      bookings.forEach((booking) => {
        if (booking.partner_id) {
          partnerBookings[booking.partner_id] = (partnerBookings[booking.partner_id] || 0) + 1;
        }
      });
      const topPartnerId = Object.entries(partnerBookings).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topPartner = topPartnerId
        ? partners.find((partner) => partner.id === topPartnerId) || null
        : null;

      setStats({
        totalUsers: users.length,
        totalPets: pets.length,
        totalPartners: partners.filter((partner) => partner.is_active).length,
        totalOrders: orders.length,
        totalBookings: bookings.length,
        salesVolume,
        subscriptionMrr,
        activeSubscriptions: activeSubscriptions.length,
        trialSubscriptions,
        avgOrderValue,
        topPartner,
        recentGrowth: {
          users: recentUsers,
          orders: recentOrders,
          bookings: recentBookings,
        },
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center">Cargando reportes...</div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Resumen General</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Usuarios"
            value={String(stats.totalUsers)}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            iconClass="bg-blue-100"
            detail={`+${stats.recentGrowth.users} último mes`}
          />
          <MetricCard
            label="Total Mascotas"
            value={String(stats.totalPets)}
            icon={<PawPrint className="h-6 w-6 text-purple-600" />}
            iconClass="bg-purple-100"
          />
          <MetricCard
            label="Aliados Activos"
            value={String(stats.totalPartners)}
            icon={<Store className="h-6 w-6 text-teal-600" />}
            iconClass="bg-teal-100"
          />
          <MetricCard
            label="Volumen Vendido"
            value={`$${stats.salesVolume.toFixed(2)}`}
            icon={<DollarSign className="h-6 w-6 text-green-600" />}
            iconClass="bg-green-100"
            detail="Cobrado directamente por los aliados"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Métricas de Ventas</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Total Pedidos"
            value={String(stats.totalOrders)}
            icon={<ShoppingCart className="h-6 w-6 text-amber-600" />}
            iconClass="bg-amber-100"
            detail={`+${stats.recentGrowth.orders} último mes`}
          />
          <MetricCard
            label="Total Citas"
            value={String(stats.totalBookings)}
            icon={<Calendar className="h-6 w-6 text-indigo-600" />}
            iconClass="bg-indigo-100"
            detail={`+${stats.recentGrowth.bookings} último mes`}
          />
          <MetricCard
            label="Valor Promedio Pedido"
            value={`$${stats.avgOrderValue.toFixed(2)}`}
            icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
            iconClass="bg-emerald-100"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Suscripciones de Aliados
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <MetricCard
            label="Ingreso Mensual Recurrente"
            value={`$${stats.subscriptionMrr.toFixed(2)}`}
            icon={<CreditCard className="h-6 w-6 text-[#2D6A6F]" />}
            iconClass="bg-[#DCEBE7]"
            detail={`${stats.activeSubscriptions} suscripciones pagas · ${stats.trialSubscriptions} en prueba`}
          />

          {stats.topPartner ? (
            <MetricCard
              label="Aliado Destacado"
              value={stats.topPartner.business_name || 'Aliado'}
              icon={<BarChart3 className="h-6 w-6 text-yellow-600" />}
              iconClass="bg-yellow-100"
              detail="Con más reservas registradas"
            />
          ) : (
            <MetricCard
              label="Modelo Comercial"
              value="Suscripción SaaS"
              icon={<Store className="h-6 w-6 text-violet-600" />}
              iconClass="bg-violet-100"
              detail="Sin porcentaje retenido sobre las ventas"
            />
          )}
        </div>
      </section>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 text-sm font-semibold text-blue-800">Crecimiento Último Mes</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Growth value={stats.recentGrowth.users} label="Nuevos Usuarios" />
          <Growth value={stats.recentGrowth.orders} label="Nuevos Pedidos" />
          <Growth value={stats.recentGrowth.bookings} label="Nuevas Citas" />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  icon,
  iconClass,
  detail,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  iconClass: string;
  detail?: string;
}) => (
  <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className={`mb-4 inline-flex rounded-lg p-3 ${iconClass}`}>{icon}</div>
    <h3 className="mb-1 text-sm text-gray-600">{label}</h3>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
    {detail && <p className="mt-2 text-xs text-gray-500">{detail}</p>}
  </article>
);

const Growth = ({ value, label }: { value: number; label: string }) => (
  <div>
    <p className="text-2xl font-bold text-blue-600">+{value}</p>
    <p className="text-xs text-blue-700">{label}</p>
  </div>
);

export default ReportsManager;
