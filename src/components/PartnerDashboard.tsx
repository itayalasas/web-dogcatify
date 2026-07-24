import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  | 'settings';

const menuItems = [
  { id: 'overview', label: 'Vista general', icon: LayoutDashboard },
  { id: 'businesses', label: 'Negocios y servicios', icon: Briefcase },
  { id: 'appointments', label: 'Citas', icon: Calendar },
  { id: 'new-appointment', label: 'Agendar cita', icon: CalendarPlus },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'schedule', label: 'Horarios', icon: Clock3 },
  { id: 'earnings', label: 'Ganancias', icon: DollarSign },
  { id: 'messages', label: 'Mensajes', icon: MessageSquare },
  { id: 'settings', label: 'Perfil y configuración', icon: Settings },
] satisfies { id: Section; label: string; icon: typeof Store }[];

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
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [partners, setPartners] = useState<Partner[]>([]);
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

    const { data, error: queryError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (queryError) {
      setError('No pudimos cargar los negocios asociados a esta cuenta.');
      setLoading(false);
      return;
    }

    const nextPartners = (data || []) as Partner[];
    setPartners(nextPartners);
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

  const selectSection = (section: Section) => {
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
          <span className="partner-brand-logo" aria-hidden="true" />
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
            return (
              <button
                key={item.id}
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => selectSection(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
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
            {selectedPartner.is_active ? 'Negocio activo' : 'Negocio inactivo'}
          </div>
        </header>

        {error && <div className="partner-alert">{error}</div>}

        <div className="partner-content">
          {activeSection === 'overview' && (
            <PartnerOverview partner={selectedPartner} onNavigate={selectSection} />
          )}
          {activeSection === 'businesses' && <MyBusinesses partnerId={selectedPartner.id} />}
          {activeSection === 'appointments' && <MyBookings partnerId={selectedPartner.id} />}
          {activeSection === 'new-appointment' && (
            <ManualBooking
              partnerId={selectedPartner.id}
              partnerName={selectedPartner.business_name}
              onBookingCreated={() => setActiveSection('appointments')}
            />
          )}
          {activeSection === 'products' && <PartnerProducts partner={selectedPartner} />}
          {activeSection === 'orders' && <PartnerOrders partnerId={selectedPartner.id} />}
          {activeSection === 'clients' && <PartnerClients partnerId={selectedPartner.id} />}
          {activeSection === 'reviews' && <MyReviews partnerId={selectedPartner.id} />}
          {activeSection === 'schedule' && <PartnerSchedule partner={selectedPartner} />}
          {activeSection === 'earnings' && <PartnerEarnings partnerId={selectedPartner.id} />}
          {activeSection === 'messages' && user && <PartnerMessages partner={selectedPartner} userId={user.id} />}
          {activeSection === 'settings' && (
            <PartnerSettings partner={selectedPartner} onSaved={() => loadPartners(selectedPartner.id)} />
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
