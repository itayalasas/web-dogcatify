import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  Calendar,
  CalendarPlus,
  ChevronDown,
  Clock3,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PawPrint,
  ShieldCheck,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Partner } from '../services/admin.service';
import {
  subscriptionService,
  type SubscriptionPlan,
} from '../services/subscription.service';
import {
  canAccessPartnerModule,
  getPartnerLockedActionLabel,
  getPartnerPlan,
  getPartnerSubscriptionStatusLabel,
  normalizePartnerPlanTier,
  resolvePartnerAccountSubscription,
  type PartnerModule,
} from '../utils/partnerPlans';
import { resolvePartnerPlanLimits } from '../utils/subscriptionPlanLimits';
import MyBookings from './partner/MyBookings';
import MyBusinesses from './partner/MyBusinesses';
import MyReviews from './partner/MyReviews';
import ManualBooking from './partner/ManualBooking';
import {
  PartnerClients,
  PartnerEarnings,
  PartnerMessages,
  PartnerOrders,
  PartnerOverview,
  PartnerProducts,
  PartnerSchedule,
  PartnerSettings,
} from './partner/PartnerPortalModules';
import PartnerSubscriptionManager from './partner/PartnerSubscriptionManager';
import './partner-dashboard.css';

type Section =
  | 'overview'
  | 'businesses'
  | 'appointments'
  | 'new-appointment'
  | 'products'
  | 'orders'
  | 'clients'
  | 'reviews'
  | 'schedule'
  | 'earnings'
  | 'messages'
  | 'subscription'
  | 'settings';

const menuItems = [
  { id: 'overview', label: 'Vista general', icon: LayoutDashboard },
  { id: 'businesses', label: 'Negocios y servicios', icon: Briefcase },
  { id: 'appointments', label: 'Citas', icon: Calendar },
  { id: 'new-appointment', label: 'Agendar cita', icon: CalendarPlus },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { id: 'clients', label: 'Clientes', icon: Users, module: 'clients' },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'schedule', label: 'Horarios', icon: Clock3 },
  { id: 'earnings', label: 'Analítica de ventas', icon: DollarSign, module: 'insights' },
  { id: 'messages', label: 'Mensajes', icon: MessageSquare },
  { id: 'subscription', label: 'Plan y suscripción', icon: ShieldCheck },
  { id: 'settings', label: 'Perfil y configuración', icon: Settings },
] satisfies { id: Section; label: string; icon: typeof Store; module?: PartnerModule }[];

const businessTypeLabel: Record<string, string> = {
  veterinary: 'Veterinaria',
  grooming: 'Peluquería',
  walking: 'Paseos',
  boarding: 'Pensión',
  daycare: 'Guardería',
  shop: 'Tienda',
  shelter: 'Refugio',
};

export default function PartnerDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedSection = searchParams.get('section') as Section | null;
  const [activeSection, setActiveSection] = useState<Section>(
    requestedSection && ['overview', 'subscription', 'settings'].includes(requestedSection)
      ? requestedSection
      : 'overview',
  );
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedPartner = useMemo(
    () => partners.find((partner) => partner.id === selectedPartnerId) || partners[0] || null,
    [partners, selectedPartnerId],
  );

  const loadPartners = async (preferredPartnerId?: string) => {
    if (!user?.id) return;
    setLoading(true);
    setError('');

    const [partnerResult, planResult] = await Promise.all([
      supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      subscriptionService.getPartnerPlans().catch(() => []),
    ]);

    if (partnerResult.error) {
      setError('No pudimos cargar los negocios asociados a esta cuenta.');
      setLoading(false);
      return;
    }

    const nextPartners = (partnerResult.data || []) as Partner[];
    setPartners(nextPartners);
    setPlans(planResult);
    const currentStillExists = nextPartners.some((partner) => partner.id === preferredPartnerId);
    setSelectedPartnerId(currentStillExists ? preferredPartnerId! : nextPartners[0]?.id || '');
    setLoading(false);
  };

  useEffect(() => {
    loadPartners(selectedPartnerId);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`web-partner-account-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partners', filter: `user_id=eq.${user.id}` },
        () => loadPartners(selectedPartnerId),
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, selectedPartnerId]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const verifiedPartners = partners.filter((partner) => partner.is_verified);
  const accountSubscription = resolvePartnerAccountSubscription(
    verifiedPartners.length ? verifiedPartners : partners,
  );
  const effectiveTier = accountSubscription?.subscriptionPlanTier || 'starter';
  const effectivePlan = getPartnerPlan(effectiveTier);
  const planRow =
    plans.find((plan) => normalizePartnerPlanTier(plan.tier || plan.name) === effectiveTier) ||
    null;
  const planLimits = resolvePartnerPlanLimits(planRow || { tier: effectiveTier, audience_target: 'partners' });

  const canOpenSection = (section: Section) => {
    const item = menuItems.find((menuItem) => menuItem.id === section);
    if (!item) return false;
    if (
      selectedPartner &&
      !selectedPartner.is_verified &&
      !['overview', 'subscription', 'settings'].includes(section)
    ) {
      return false;
    }
    if (!item.module) return true;
    return canAccessPartnerModule(
      effectiveTier,
      item.module,
      selectedPartner?.business_type,
      accountSubscription?.subscriptionPlanStatus,
      accountSubscription?.subscriptionPlanExpiresAt,
    );
  };

  const selectSection = (section: Section) => {
    if (!canOpenSection(section)) {
      const item = menuItems.find((menuItem) => menuItem.id === section);
      setError(
        selectedPartner && !selectedPartner.is_verified
          ? 'Este módulo estará disponible cuando DogCatiFy verifique el negocio.'
          : item?.module
            ? `${getPartnerLockedActionLabel(item.module)}. Actualiza la suscripción para ingresar.`
            : 'Este módulo no está disponible.',
      );
      return;
    }
    setError('');
    setActiveSection(section);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="partner-shell-state">
        <img src="/logo-transp.png" alt="" />
        <span />
        <p>Preparando tu portal DogCatiFy…</p>
      </div>
    );
  }

  if (!selectedPartner) {
    return (
      <main className="partner-shell-state">
        <div className="partner-state-icon"><Store /></div>
        <h1>Tu cuenta aún no tiene un negocio asociado</h1>
        <p>
          Completá el registro de aliado desde la app móvil o contactá al equipo de DogCatiFy para
          vincular tu negocio.
        </p>
        {error && <div className="partner-alert">{error}</div>}
        <button onClick={handleSignOut}>Cerrar sesión</button>
      </main>
    );
  }

  const activeItem = menuItems.find((item) => item.id === activeSection)!;

  return (
    <div className="partner-dashboard">
      <aside className={`partner-sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="partner-brand">
          <span className="partner-brand-logo" aria-hidden="true"><PawPrint /></span>
          <div>
            <strong>DogCatiFy</strong>
            <span>Portal de aliados</span>
          </div>
          <button className="partner-close-menu" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú">
            <X />
          </button>
        </div>

        <div className="partner-business-switcher">
          <span>Negocio activo</span>
          <label>
            <Store />
            <select
              value={selectedPartner.id}
              onChange={(event) => {
                setSelectedPartnerId(event.target.value);
                setActiveSection('overview');
              }}
            >
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.business_name}</option>
              ))}
            </select>
            <ChevronDown />
          </label>
          <small>{businessTypeLabel[selectedPartner.business_type] || selectedPartner.business_type}</small>
        </div>

        <nav aria-label="Navegación del portal">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const allowed = canOpenSection(item.id);
            return (
              <button
                key={item.id}
                className={`${activeSection === item.id ? 'active' : ''} ${allowed ? '' : 'locked'}`}
                onClick={() => selectSection(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
                {!allowed && <small>{item.module ? getPartnerLockedActionLabel(item.module) : 'Pendiente'}</small>}
              </button>
            );
          })}
        </nav>

        <div className="partner-account">
          <div>
            <span>{(profile?.display_name || user?.email || 'A').slice(0, 1).toUpperCase()}</span>
            <p><strong>{profile?.display_name || 'Aliado DogCatiFy'}</strong><small>{user?.email}</small></p>
          </div>
          <button onClick={handleSignOut}><LogOut /> Cerrar sesión</button>
        </div>
      </aside>

      {mobileMenuOpen && <button className="partner-backdrop" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú" />}

      <main className="partner-main">
        <header className="partner-topbar">
          <button className="partner-open-menu" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú"><Menu /></button>
          <div>
            <p>Administrá desde un solo lugar</p>
            <h1>{activeItem.label}</h1>
          </div>
          <div className="partner-status">
            <span className={selectedPartner.is_active ? 'active' : ''} />
            <div>
              <strong>Plan {effectivePlan.name}</strong>
              <small>
                {getPartnerSubscriptionStatusLabel(
                  accountSubscription?.subscriptionPlanStatus,
                  accountSubscription?.subscriptionPlanExpiresAt,
                )}
              </small>
            </div>
          </div>
        </header>

        {error && <div className="partner-alert">{error}</div>}

        <div className="partner-content">
          {activeSection === 'overview' && (
            <PartnerOverview partner={selectedPartner} onNavigate={selectSection} />
          )}
          {activeSection === 'businesses' && (
            <MyBusinesses
              partnerId={selectedPartner.id}
              accountPartnerIds={partners.map((partner) => partner.id)}
              maxServices={planLimits.maxServices}
            />
          )}
          {activeSection === 'appointments' && <MyBookings partnerId={selectedPartner.id} />}
          {activeSection === 'new-appointment' && (
            <ManualBooking
              partnerId={selectedPartner.id}
              partnerName={selectedPartner.business_name}
              onBookingCreated={() => setActiveSection('appointments')}
            />
          )}
          {activeSection === 'products' && (
            <PartnerProducts
              partner={selectedPartner}
              accountPartnerIds={partners.map((partner) => partner.id)}
              maxProducts={planLimits.maxProducts}
            />
          )}
          {activeSection === 'orders' && <PartnerOrders partnerId={selectedPartner.id} />}
          {activeSection === 'clients' && <PartnerClients partnerId={selectedPartner.id} />}
          {activeSection === 'reviews' && <MyReviews partnerId={selectedPartner.id} />}
          {activeSection === 'schedule' && <PartnerSchedule partner={selectedPartner} />}
          {activeSection === 'earnings' && <PartnerEarnings partnerId={selectedPartner.id} />}
          {activeSection === 'messages' && user && <PartnerMessages partner={selectedPartner} userId={user.id} />}
          {activeSection === 'subscription' && (
            <PartnerSubscriptionManager
              partners={partners}
              onChanged={() => loadPartners(selectedPartner.id)}
            />
          )}
          {activeSection === 'settings' && (
            <PartnerSettings
              partner={selectedPartner}
              accountSubscription={accountSubscription}
              onSubscription={() => selectSection('subscription')}
              onSaved={() => loadPartners(selectedPartner.id)}
            />
          )}
        </div>

        <footer className="partner-footer">
          <span><BarChart3 /> Datos sincronizados con la app DogCatiFy</span>
          <span>© {new Date().getFullYear()} DogCatiFy</span>
        </footer>
      </main>
    </div>
  );
}
