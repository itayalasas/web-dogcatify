import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { CalendarDays, CheckCircle, Clock, DollarSign, Edit3, Mail, MapPin, MessageSquare, Package, Plus, Save, Search, ShoppingBag, Star, Store, Trash2, Truck, UserRound, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Partner, PartnerProduct } from '../../services/admin.service';
import { partnerOrdersService, partnerProductsService } from '../../services/partner.service';
import PartnerProfileModal from '../admin/PartnerProfileModal';

const money = (value: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(value || 0);
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('es-UY') : '—';
const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  reserved: 'Reservado',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  preparing: 'Preparando',
  ready_for_delivery: 'Listo',
  shipped: 'Enviado',
  delivered: 'Entregado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  refunded: 'Reintegrado',
  payment_failed: 'Pago fallido',
  paid: 'Pagado',
};
const badge = (status?: string | null) => <span className={`portal-badge portal-badge-${status || 'pending'}`}>{statusLabel[status || 'pending'] || status}</span>;

type PortalSection = 'appointments' | 'businesses' | 'orders' | 'clients' | 'products' | 'reviews' | 'schedule' | 'earnings';
type DashboardPeriod = 'today' | 'week' | 'month' | 'all';

export function PartnerOverview({ partner, onNavigate }: { partner: Partner; onNavigate: (section: PortalSection) => void }) {
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [bookingResult, orderRows, reviewResult, productResult, serviceResult] = await Promise.all([
          supabase.from('bookings').select('*').eq('partner_id', partner.id).order('created_at', { ascending: false }),
          partnerOrdersService.getMyOrders(partner.id),
          supabase.from('service_reviews').select('*').eq('partner_id', partner.id).order('created_at', { ascending: false }),
          supabase.from('partner_products').select('id,is_active').eq('partner_id', partner.id),
          supabase.from('partner_services').select('id,is_active').eq('partner_id', partner.id),
        ]);
        if (bookingResult.error) throw bookingResult.error;
        if (reviewResult.error) throw reviewResult.error;
        if (productResult.error) throw productResult.error;
        if (serviceResult.error) throw serviceResult.error;
        if (!active) return;
        setBookings(bookingResult.data || []);
        setOrders(orderRows || []);
        setReviews(reviewResult.data || []);
        setProducts(productResult.data || []);
        setServices(serviceResult.data || []);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el resumen.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [partner.id]);

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (period === 'all') return null;
    if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start;
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [period]);

  const inRange = (value?: string | null) => !rangeStart || (!!value && new Date(value) >= rangeStart);
  const periodBookings = bookings.filter((item) => inRange(item.date || item.created_at));
  const periodOrders = orders.filter((item) => inRange(item.created_at));
  const paidOrders = periodOrders.filter((item) => item.payment_status === 'paid' || ['delivered', 'completed'].includes(item.status));
  const customerKeys = new Set(
    [...periodBookings, ...periodOrders]
      .map((item) => item.customer_id || item.customer_email || item.customer_phone)
      .filter(Boolean),
  );
  const rating = reviews.length
    ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length
    : 0;
  const netIncome = paidOrders.reduce(
    (sum, item) => sum + Number(item.partner_amount ?? (Number(item.total_amount || 0) - Number(item.commission_amount || 0))),
    0,
  );
  const pendingBookings = periodBookings.filter((item) => ['pending', 'confirmed'].includes(item.status)).length;
  const activeCatalog = products.filter((item) => item.is_active).length + services.filter((item) => item.is_active).length;
  const recentActivity = [
    ...periodBookings.slice(0, 4).map((item) => ({
      id: `booking-${item.id}`,
      kind: 'Cita',
      title: item.service_name || 'Servicio',
      detail: `${item.customer_name || 'Cliente'} · ${item.pet_name || 'Mascota'}`,
      date: item.date || item.created_at,
      status: item.status,
    })),
    ...periodOrders.slice(0, 4).map((item) => ({
      id: `order-${item.id}`,
      kind: item.order_type === 'service_booking' ? 'Reserva' : 'Pedido',
      title: item.order_number || `Pedido #${String(item.id).slice(0, 7)}`,
      detail: item.customer_name || item.customer_email || 'Cliente DogCatiFy',
      date: item.created_at,
      status: item.status,
    })),
  ]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 6);

  if (loading) return <Loading label="Sincronizando datos reales" />;

  return (
    <Module title={`Hola, ${partner.business_name}`} description="El pulso real de tu negocio en DogCatiFy.">
      <div className="portal-overview-actions">
        <div>
          <span className={partner.is_verified ? 'verified' : ''}>{partner.is_verified ? 'Negocio verificado' : 'Verificación pendiente'}</span>
          <small>{partner.is_active ? 'Tu ficha está visible en la app.' : 'Tu ficha no está visible para clientes.'}</small>
        </div>
        <label>
          Período
          <select value={period} onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}>
            <option value="today">Hoy</option>
            <option value="week">Últimos 7 días</option>
            <option value="month">Este mes</option>
            <option value="all">Todo el historial</option>
          </select>
        </label>
      </div>
      {error && <div className="portal-error">{error}</div>}
      <div className="portal-stat-grid portal-stat-grid-overview">
        <Stat label="Citas activas" value={String(pendingBookings)} icon={<CalendarDays />} />
        <Stat label="Ingreso neto" value={money(netIncome)} icon={<DollarSign />} />
        <Stat label="Clientes" value={String(customerKeys.size)} icon={<Users />} />
        <Stat label="Catálogo activo" value={String(activeCatalog)} icon={<Package />} />
        <Stat label="Calificación" value={rating ? `${rating.toFixed(1)} / 5` : 'Sin reseñas'} icon={<Star />} />
      </div>
      <div className="portal-overview-grid">
        <section className="portal-panel">
          <div className="portal-panel-heading">
            <div><p>Últimos movimientos</p><h3>Actividad reciente</h3></div>
            <button onClick={() => onNavigate('orders')}>Ver pedidos</button>
          </div>
          <div className="portal-activity-list">
            {recentActivity.map((item) => (
              <article key={item.id}>
                <span>{item.kind === 'Cita' ? <CalendarDays /> : <ShoppingBag />}</span>
                <div><small>{item.kind}</small><strong>{item.title}</strong><p>{item.detail}</p></div>
                <div>{badge(item.status)}<small>{date(item.date)}</small></div>
              </article>
            ))}
          </div>
          <Empty show={!recentActivity.length} icon={<CalendarDays />} title="Todavía no hay actividad" text="Las citas y pedidos de la app aparecerán aquí." />
        </section>
        <section className="portal-panel portal-quick-panel">
          <div className="portal-panel-heading"><div><p>Atajos</p><h3>Seguí gestionando</h3></div></div>
          <button onClick={() => onNavigate('appointments')}><CalendarDays /><span><strong>Revisar agenda</strong><small>Confirmá y gestioná próximas citas</small></span></button>
          <button onClick={() => onNavigate('businesses')}><Store /><span><strong>Negocios y servicios</strong><small>Actualizá tu oferta comercial</small></span></button>
          <button onClick={() => onNavigate('clients')}><UserRound /><span><strong>Ver clientes</strong><small>Consultá el historial de interacciones</small></span></button>
          <button onClick={() => onNavigate('earnings')}><DollarSign /><span><strong>Revisar ganancias</strong><small>Ventas, comisiones e ingreso neto</small></span></button>
        </section>
      </div>
    </Module>
  );
}

export function PartnerProducts({ partner }: { partner: Partner }) {
  const partnerId = partner.id;
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PartnerProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const emptyProduct = { name: '', description: '', category: '', price: '', iva_rate: String(partner.iva_rate ?? 0), stock: '', brand: '', weight: '', size: '', color: '', age_range: '', pet_type: '', images: '', currency: 'UYU' };
  const [form, setForm] = useState(emptyProduct);
  const load = async () => { setLoading(true); try { setProducts(await partnerProductsService.getMyProducts(partnerId)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [partnerId]);
  const toggle = async (product: PartnerProduct) => { await partnerProductsService.toggleActive(product.id, !product.is_active); load(); };
  const openForm = (product?: PartnerProduct) => {
    setEditing(product || null);
    setForm(product ? {
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: String(product.price || ''),
      iva_rate: String(product.iva_rate ?? partner.iva_rate ?? 0),
      stock: String(product.stock ?? ''),
      brand: product.brand || '',
      weight: product.weight || '',
      size: product.size || '',
      color: product.color || '',
      age_range: product.age_range || '',
      pet_type: product.pet_type || '',
      images: product.images?.join('\n') || '',
      currency: product.currency || 'UYU',
    } : emptyProduct);
    setShowForm(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      partner_id: partnerId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      price: Number(form.price),
      iva_rate: Number(form.iva_rate || 0),
      stock: Number(form.stock || 0),
      brand: form.brand.trim() || null,
      weight: form.weight.trim() || null,
      size: form.size.trim() || null,
      color: form.color.trim() || null,
      age_range: form.age_range.trim() || null,
      pet_type: form.pet_type.trim() || null,
      images: form.images.split(/\r?\n|,/).map(item => item.trim()).filter(Boolean),
      currency: form.currency,
      currency_code_dgi: form.currency === 'UYU' ? '858' : '840',
      partner_name: partner.business_name,
      is_active: editing?.is_active ?? true,
      updated_at: new Date().toISOString(),
    };
    const query = editing
      ? supabase.from('partner_products').update(payload).eq('id', editing.id)
      : supabase.from('partner_products').insert({ ...payload, created_at: new Date().toISOString() });
    const { error } = await query;
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setShowForm(false);
    setEditing(null);
    load();
  };
  if (loading) return <Loading label="Cargando productos" />;
  return <Module title="Productos" description="Catálogo publicado en DogCatiFy.">
    <div className="portal-toolbar"><div><strong>{products.length}</strong><span> productos registrados</span></div><button className="portal-primary" onClick={() => openForm()}><Plus /> Nuevo producto</button></div>
    {showForm && <form className="portal-editor" onSubmit={save}>
      <div className="portal-editor-heading"><div><p>Catálogo de la app</p><h3>{editing ? 'Editar producto' : 'Nuevo producto'}</h3></div><button type="button" onClick={() => setShowForm(false)}>Cerrar</button></div>
      <div className="portal-form-row"><Field label="Nombre *"><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field><Field label="Categoría"><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Seleccionar</option><option>Comida</option><option>Juguetes</option><option>Accesorios</option><option>Higiene</option><option>Salud</option><option>Ropa</option><option>Otros</option></select></Field></div>
      <Field label="Descripción"><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
      <div className="portal-form-row"><Field label="Precio *"><input required type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field><Field label="Moneda"><select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}><option value="UYU">UYU · Peso uruguayo</option><option value="USD">USD · Dólar</option></select></Field></div>
      <div className="portal-form-row"><Field label="IVA (%)"><input type="number" min="0" step="0.01" value={form.iva_rate} onChange={e => setForm({ ...form, iva_rate: e.target.value })} /></Field><Field label="Stock"><input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></Field></div>
      <div className="portal-form-row"><Field label="Marca"><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></Field><Field label="Tipo de mascota"><select value={form.pet_type} onChange={e => setForm({ ...form, pet_type: e.target.value })}><option value="">Todos</option><option value="dog">Perros</option><option value="cat">Gatos</option><option value="other">Otros</option></select></Field></div>
      <div className="portal-form-row"><Field label="Peso / presentación"><input value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} placeholder="2 kg" /></Field><Field label="Tamaño"><input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} /></Field></div>
      <div className="portal-form-row"><Field label="Color"><input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></Field><Field label="Rango de edad"><input value={form.age_range} onChange={e => setForm({ ...form, age_range: e.target.value })} placeholder="Cachorro, adulto…" /></Field></div>
      <Field label="URLs de imágenes (una por línea)"><textarea rows={3} value={form.images} onChange={e => setForm({ ...form, images: e.target.value })} placeholder={'https://…\nhttps://…'} /></Field>
      <button className="portal-primary" disabled={saving}><Save /> {saving ? 'Guardando…' : 'Guardar producto'}</button>
    </form>}
    <div className="portal-card-grid">{products.map(product => <article className="portal-item-card" key={product.id}>
      <div className="portal-item-image">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : <Package />}</div>
      <div><div className="portal-item-top"><p>{product.category || 'Producto'}</p>{badge(product.is_active ? 'completed' : 'cancelled')}</div><h3>{product.name}</h3><p>{product.description || 'Sin descripción'}</p><div className="portal-item-bottom"><strong>{money(product.price)}</strong><span>Stock · {product.stock ?? 0}</span></div><div className="portal-card-actions"><button className="portal-secondary" onClick={() => openForm(product)}><Edit3 /> Editar</button><button className="portal-secondary" onClick={() => toggle(product)}>{product.is_active ? 'Pausar' : 'Activar'}</button></div></div>
    </article>)}</div><Empty show={!products.length} icon={<Package />} title="No hay productos" text="Los productos creados desde la app aparecerán aquí." />
  </Module>;
}

export function PartnerOrders({ partnerId }: { partnerId: string }) {
  const [orders, setOrders] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState('');
  const load = async () => { setLoading(true); try { setOrders(await partnerOrdersService.getMyOrders(partnerId)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [partnerId]);
  const visible = orders.filter(order => !filter || [order.order_number, order.customer_name, order.status].some(value => String(value || '').toLowerCase().includes(filter.toLowerCase())));
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) alert(error.message);
    else load();
  };
  if (loading) return <Loading label="Cargando pedidos" />;
  return <Module title="Pedidos" description="Ventas y reservas convertidas en órdenes."><SearchBox value={filter} onChange={setFilter} placeholder="Buscar pedido o cliente" /><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Tu ingreso</th><th>Pago</th><th>Estado</th><th>Actualizar</th></tr></thead><tbody>{visible.map(order => <tr key={order.id}><td><strong>{order.order_number || `#${String(order.id).slice(0, 8)}`}</strong><small>{order.order_type === 'service_booking' ? 'Reserva de servicio' : 'Compra de producto'}</small></td><td>{order.customer_name || order.customer_email || 'Cliente'}</td><td>{date(order.created_at)}</td><td>{money(order.total_amount)}</td><td>{money(order.partner_amount ?? (Number(order.total_amount || 0) - Number(order.commission_amount || 0)))}</td><td>{badge(order.payment_status)}</td><td>{badge(order.status)}</td><td><select className="portal-status-select" value={order.status || 'pending'} onChange={(event) => updateStatus(order.id, event.target.value)}><option value="pending">Pendiente</option><option value="confirmed">Confirmado</option><option value="processing">En proceso</option><option value="preparing">Preparando</option><option value="ready_for_delivery">Listo</option><option value="shipped">Enviado</option><option value="delivered">Entregado</option><option value="completed">Completado</option><option value="cancelled">Cancelado</option></select></td></tr>)}</tbody></table></div><Empty show={!visible.length} icon={<Store />} title="No hay pedidos" text="Los pedidos de la app aparecerán en este módulo." /></Module>;
}

export function PartnerClients({ partnerId }: { partnerId: string }) {
  const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState('');
  useEffect(() => { (async () => { setLoading(true); const [{ data: bookings }, { data: orders }] = await Promise.all([supabase.from('bookings').select('customer_id,customer_name,customer_email,customer_phone,pet_name,date,total_amount').eq('partner_id', partnerId), supabase.from('orders').select('customer_id,customer_name,customer_email,customer_phone,created_at,total_amount').eq('partner_id', partnerId)]); const clients = new Map<string, any>(); [...(bookings || []), ...(orders || [])].forEach((item: any) => { const key = item.customer_id || item.customer_email || item.customer_phone; if (!key) return; const current = clients.get(key) || { ...item, visits: 0, spent: 0, pets: new Set<string>(), last: null }; current.visits += 1; current.spent += Number(item.total_amount || 0); if (item.pet_name) current.pets.add(item.pet_name); const itemDate = item.date || item.created_at; if (!current.last || new Date(itemDate) > new Date(current.last)) current.last = itemDate; clients.set(key, current); }); setRows([...clients.values()].map(item => ({ ...item, pets: [...item.pets] }))); setLoading(false); })(); }, [partnerId]);
  const visible = rows.filter(row => !filter || [row.customer_name, row.customer_email, row.customer_phone].some(value => String(value || '').toLowerCase().includes(filter.toLowerCase())));
  if (loading) return <Loading label="Cargando clientes" />;
  return <Module title="Clientes" description="Personas que reservaron servicios o realizaron compras."><SearchBox value={filter} onChange={setFilter} placeholder="Buscar por nombre, correo o teléfono" /><div className="portal-card-grid">{visible.map((client, index) => <article className="portal-person-card" key={client.customer_id || client.customer_email || index}><span><UserRound /></span><div><h3>{client.customer_name || 'Cliente DogCatiFy'}</h3><p>{client.customer_email || 'Sin correo'}</p><p>{client.customer_phone || 'Sin teléfono'}</p><small>{client.pets.length ? `Mascotas: ${client.pets.join(', ')}` : 'Sin mascota asociada'}</small></div><div><strong>{client.visits}</strong><small>operaciones</small><b>{money(client.spent)}</b><small>total</small></div></article>)}</div><Empty show={!visible.length} icon={<UserRound />} title="Sin clientes todavía" text="La cartera se crea automáticamente desde reservas y pedidos." /></Module>;
}

export function PartnerSchedule({ partner }: { partner: Partner }) {
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [closures, setClosures] = useState<any[]>([]);
  const [closure, setClosure] = useState({ closed_date: '', reason: '' });
  const [form, setForm] = useState({ day_of_week: '1', start_time: '09:00', end_time: '17:00', break_start_time: '12:00', break_end_time: '13:00', max_slots: '8', slot_duration: '60' });
  const requiresAppointments = !['boarding','shop'].includes(partner.business_type);
  const load = async () => { setLoading(true); const [{ data }, { data: closureRows }] = await Promise.all([supabase.from('business_schedule').select('*').eq('partner_id', partner.id).order('day_of_week'), supabase.from('business_schedule_closures').select('*').eq('partner_id', partner.id).order('closed_date')]); setRows(data || []); setClosures(closureRows || []); setLoading(false); };
  useEffect(() => { load(); }, [partner.id]);
  const add = async (event: FormEvent) => { event.preventDefault(); if (form.end_time <= form.start_time) { alert('La hora de cierre debe ser posterior a la apertura.'); return; } if (form.break_start_time && form.break_end_time && (form.break_start_time < form.start_time || form.break_end_time > form.end_time || form.break_end_time <= form.break_start_time)) { alert('La pausa debe estar dentro del horario configurado.'); return; } const payload = { partner_id: partner.id, day_of_week: Number(form.day_of_week), start_time: form.start_time, end_time: form.end_time, break_start_time: form.break_start_time || null, break_end_time: form.break_end_time || null, max_slots: requiresAppointments ? Number(form.max_slots) : 0, slot_duration: requiresAppointments ? Number(form.slot_duration) : 0, is_active: true }; const existing = rows.find(row => row.day_of_week === payload.day_of_week); const query = existing ? supabase.from('business_schedule').update(payload).eq('id', existing.id) : supabase.from('business_schedule').insert(payload); const { error } = await query; if (error) alert(error.message); else load(); };
  const toggle = async (row: any) => { await supabase.from('business_schedule').update({ is_active: !row.is_active }).eq('id', row.id); load(); };
  const addClosure = async (event: FormEvent) => { event.preventDefault(); if (!closure.closed_date) return; const { error } = await supabase.from('business_schedule_closures').insert({ partner_id: partner.id, closed_date: closure.closed_date, reason: closure.reason.trim() || 'Cierre especial', closure_type: 'manual' }); if (error) alert(error.message); else { setClosure({ closed_date: '', reason: '' }); load(); } };
  const removeClosure = async (id: string) => { const { error } = await supabase.from('business_schedule_closures').delete().eq('id', id); if (error) alert(error.message); else load(); };
  if (loading) return <Loading label="Cargando horarios" />;
  return <Module title="Horarios" description={requiresAppointments ? 'Disponibilidad usada para calcular turnos en la app.' : 'Horario comercial visible para tus clientes.'}>
    <div className="portal-schedule-grid"><form className="portal-form-card" onSubmit={add}><h3>Agregar o actualizar un día</h3><Field label="Día"><select value={form.day_of_week} onChange={e=>setForm({...form,day_of_week:e.target.value})}>{days.map((label,index)=><option value={index} key={label}>{label}</option>)}</select></Field><div className="portal-form-row"><Field label="Apertura"><input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></Field><Field label="Cierre"><input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></Field></div><div className="portal-form-row"><Field label="Inicio pausa"><input type="time" value={form.break_start_time} onChange={e=>setForm({...form,break_start_time:e.target.value})}/></Field><Field label="Fin pausa"><input type="time" value={form.break_end_time} onChange={e=>setForm({...form,break_end_time:e.target.value})}/></Field></div>{requiresAppointments && <div className="portal-form-row"><Field label="Cupos máximos"><input type="number" min="1" value={form.max_slots} onChange={e=>setForm({...form,max_slots:e.target.value})}/></Field><Field label="Duración del turno"><select value={form.slot_duration} onChange={e=>setForm({...form,slot_duration:e.target.value})}><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select></Field></div>}<button className="portal-primary"><Save /> Guardar horario</button></form>
      <div className="portal-schedule-list">{rows.map(row => <article key={row.id}><span><CalendarDays /></span><div><h3>{days[row.day_of_week]}</h3><p>{String(row.start_time).slice(0,5)} — {String(row.end_time).slice(0,5)}</p>{row.break_start_time && <small>Pausa {String(row.break_start_time).slice(0,5)}–{String(row.break_end_time).slice(0,5)}</small>}{requiresAppointments && <small>{row.slot_duration} min · {row.max_slots} cupos</small>}</div><button className={row.is_active ? 'is-active' : ''} onClick={()=>toggle(row)}>{row.is_active ? 'Activo' : 'Inactivo'}</button></article>)}<Empty show={!rows.length} icon={<Clock />} title="Sin horarios configurados" text="Agregá tu primer día de atención." /></div></div>
    <div className="portal-closures"><form className="portal-form-card" onSubmit={addClosure}><h3>Cierres y excepciones</h3><p>Bloqueá feriados, licencias o días en que el negocio no atenderá.</p><Field label="Fecha de cierre"><input required type="date" value={closure.closed_date} onChange={e => setClosure({ ...closure, closed_date: e.target.value })} /></Field><Field label="Motivo"><input value={closure.reason} onChange={e => setClosure({ ...closure, reason: e.target.value })} placeholder="Feriado, licencia…" /></Field><button className="portal-primary"><Plus /> Agregar cierre</button></form><div className="portal-closure-list">{closures.map(item => <article key={item.id}><span><CalendarDays /></span><div><strong>{date(item.closed_date)}</strong><p>{item.reason || 'Cierre especial'}</p></div><button onClick={() => removeClosure(item.id)} aria-label="Eliminar cierre"><Trash2 /></button></article>)}<Empty show={!closures.length} icon={<CalendarDays />} title="Sin cierres especiales" text="La agenda usa únicamente los horarios semanales."/></div></div>
  </Module>;
}

export function PartnerEarnings({ partnerId }: { partnerId: string }) {
  const [orders, setOrders] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { partnerOrdersService.getMyOrders(partnerId).then(setOrders).finally(()=>setLoading(false)); }, [partnerId]);
  const paid = orders.filter(item => item.payment_status === 'paid' || ['delivered', 'completed'].includes(item.status)); const gross = paid.reduce((sum,item)=>sum+Number(item.total_amount||0),0); const commissions=paid.reduce((sum,item)=>sum+Number(item.commission_amount||0),0); const net=paid.reduce((sum,item)=>sum+Number(item.partner_amount ?? (Number(item.total_amount || 0) - Number(item.commission_amount || 0))),0);
  const byMonth = useMemo(() => { const map = new Map<string,number>(); paid.forEach(item => { const key = new Date(item.created_at).toLocaleDateString('es-UY',{month:'long',year:'numeric'}); map.set(key,(map.get(key)||0)+Number(item.partner_amount ?? (Number(item.total_amount || 0) - Number(item.commission_amount || 0)))); }); return [...map.entries()]; }, [orders]);
  if (loading) return <Loading label="Calculando ganancias" />;
  return <Module title="Ganancias" description="Resumen calculado desde órdenes pagadas o completadas."><div className="portal-stat-grid"><Stat label="Ventas brutas" value={money(gross)} icon={<DollarSign/>}/><Stat label="Comisiones" value={money(commissions)} icon={<CheckCircle/>}/><Stat label="Ingreso neto" value={money(net)} icon={<Store/>}/><Stat label="Operaciones" value={String(paid.length)} icon={<Package/>}/></div><div className="portal-panel"><h3>Ingresos por mes</h3>{byMonth.map(([month,total])=><div className="portal-money-row" key={month}><span>{month}</span><strong>{money(total)}</strong></div>)}<Empty show={!byMonth.length} icon={<DollarSign/>} title="Todavía no hay ingresos liquidados" text="Aquí se mostrarán las órdenes pagadas y completadas."/></div></Module>;
}

export function PartnerMessages({ partner, userId }: { partner: Partner; userId: string }) {
  const [conversations, setConversations] = useState<any[]>([]); const [selected, setSelected] = useState<any>(null); const [messages, setMessages] = useState<any[]>([]); const [text, setText] = useState(''); const [loading, setLoading] = useState(true);
  const loadConversations = async () => { setLoading(true); const { data } = await supabase.from('chat_conversations').select('*').eq('partner_id',partner.id).order('last_message_at',{ascending:false}); const processed=await Promise.all((data||[]).map(async conv=>{ const [{data:profile},{data:latest}] = await Promise.all([supabase.from('profiles').select('display_name,photo_url').eq('id',conv.user_id).maybeSingle(),supabase.from('chat_messages').select('message,created_at,is_read,sender_id').eq('conversation_id',conv.id).order('created_at',{ascending:false}).limit(1).maybeSingle()]); return {...conv,customer:profile,latest}; })); setConversations(processed); setLoading(false); };
  useEffect(()=>{loadConversations();},[partner.id]);
  const open = async (conversation:any) => { setSelected(conversation); const {data}=await supabase.from('chat_messages').select('*').eq('conversation_id',conversation.id).order('created_at'); setMessages(data||[]); const unread=(data||[]).filter(item=>!item.is_read&&item.sender_id!==userId).map(item=>item.id); if(unread.length) await supabase.from('chat_messages').update({is_read:true}).in('id',unread); };
  const send = async (event:FormEvent) => { event.preventDefault(); if(!text.trim()||!selected)return; const {error}=await supabase.from('chat_messages').insert({conversation_id:selected.id,sender_id:userId,message:text.trim(),message_type:'text',is_read:false,created_at:new Date().toISOString()}); if(!error){setText('');open(selected);await supabase.from('chat_conversations').update({last_message_at:new Date().toISOString()}).eq('id',selected.id);} };
  if(loading)return <Loading label="Cargando conversaciones"/>;
  return <Module title="Mensajes" description="Conversaciones iniciadas desde adopciones y perfiles de aliados."><div className="portal-chat"><aside>{conversations.map(conv=><button className={selected?.id===conv.id?'active':''} onClick={()=>open(conv)} key={conv.id}><span><UserRound/></span><div><strong>{conv.customer?.display_name||'Usuario DogCatiFy'}</strong><p>{conv.latest?.message||'Conversación iniciada'}</p></div>{conv.latest&&!conv.latest.is_read&&conv.latest.sender_id!==userId&&<i/>}</button>)}<Empty show={!conversations.length} icon={<MessageSquare/>} title="Sin conversaciones" text="Los mensajes de la app aparecerán aquí."/></aside><section>{selected?<><header><strong>{selected.customer?.display_name||'Usuario DogCatiFy'}</strong><small>Conversación de DogCatiFy</small></header><div className="portal-messages">{messages.map(message=><div key={message.id} className={message.sender_id===userId?'mine':''}><p>{message.message}</p><small>{new Date(message.created_at).toLocaleString('es-UY')}</small></div>)}</div><form onSubmit={send}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Escribí un mensaje…"/><button>Enviar</button></form></>:<div className="portal-chat-empty"><Mail/><h3>Seleccioná una conversación</h3><p>Podés responder sin salir del portal.</p></div>}</section></div></Module>;
}

export function PartnerSettings({ partner, onSaved }: { partner: Partner; onSaved: () => void }) {
  const [editing,setEditing]=useState(false);
  return <Module title="Perfil y configuración" description="Información pública, fiscal y operativa de tu negocio.">{editing&&<PartnerProfileModal partner={partner} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);onSaved();}}/>}<div className="portal-profile"><div className="portal-profile-brand">{partner.logo?<img src={partner.logo} alt={`Logo de ${partner.business_name}`}/>:<Store/>}<div><p>{partner.business_type}</p><h3>{partner.business_name}</h3><span>{partner.is_verified?'Negocio verificado':'Verificación pendiente'} · {partner.approval_status || 'pending'}</span></div><button className="portal-primary" onClick={()=>setEditing(true)}>Editar perfil</button></div><div className="portal-profile-grid"><Info icon={<Mail/>} label="Correo" value={partner.email}/><Info icon={<MapPin/>} label="Dirección" value={partner.address}/><Info icon={<Store/>} label="RUT" value={partner.rut}/><Info icon={<Truck/>} label="Envíos" value={partner.has_shipping?`Sí · ${money(partner.shipping_cost||0)}`:'No configurados'}/><Info icon={<DollarSign/>} label="IVA" value={`${partner.iva_rate||0}%${partner.iva_included_in_price?' incluido':''}`}/><Info icon={<CheckCircle/>} label="Mercado Pago" value={partner.mercadopago_connected?'Conectado':'Pendiente'}/><Info icon={<Package/>} label="Plan" value={`${partner.subscription_plan_tier || 'starter'} · ${partner.subscription_plan_status || 'sin estado'}`}/><Info icon={<CalendarDays/>} label="Vencimiento del plan" value={date(partner.subscription_plan_expires_at)}/><Info icon={<MapPin/>} label="Coordenadas" value={partner.latitud && partner.longitud ? `${partner.latitud}, ${partner.longitud}` : null}/></div></div></Module>;
}

function Module({title,description,children}:{title:string;description:string;children:ReactNode}) { return <section className="portal-module"><div className="portal-module-heading"><div><p>Portal de aliados</p><h2>{title}</h2></div><span>{description}</span></div>{children}</section> }
function Loading({label}:{label:string}) { return <div className="portal-loading"><span/><p>{label}…</p></div> }
function Empty({show,icon,title,text}:{show:boolean;icon:ReactNode;title:string;text:string}) { return show?<div className="portal-empty">{icon}<h3>{title}</h3><p>{text}</p></div>:null }
function SearchBox({value,onChange,placeholder}:{value:string;onChange:(value:string)=>void;placeholder:string}) { return <label className="portal-search"><Search/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label> }
function Field({label,children}:{label:string;children:ReactNode}) { return <label className="portal-field"><span>{label}</span>{children}</label> }
function Stat({label,value,icon}:{label:string;value:string;icon:ReactNode}) { return <article className="portal-stat"><span>{icon}</span><p>{label}</p><strong>{value}</strong></article> }
function Info({icon,label,value}:{icon:ReactNode;label:string;value?:string|null}) { return <div className="portal-info"><span>{icon}</span><div><small>{label}</small><strong>{value||'Sin configurar'}</strong></div></div> }
