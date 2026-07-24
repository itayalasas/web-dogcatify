import { useEffect, useState } from 'react';
import { Check, CreditCard, Edit3, RefreshCw, Save, ShieldCheck, X } from 'lucide-react';
import {
  subscriptionService,
  type SubscriptionPlan,
} from '../../services/subscription.service';
import {
  getPartnerPlan,
  normalizePartnerPlanTier,
} from '../../utils/partnerPlans';
import {
  buildPartnerLimitSummary,
  resolvePartnerPlanLimits,
} from '../../utils/subscriptionPlanLimits';

type PlanForm = {
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  currency: string;
  trial_days: string;
  max_businesses: string;
  max_services: string;
  max_products: string;
  max_promotions: string;
  is_active: boolean;
  is_recommended: boolean;
};

const toLimit = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
};

const money = (value: number, currency: string) =>
  value === 0
    ? 'Gratis'
    : new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: currency || 'UYU',
        maximumFractionDigits: 0,
      }).format(value);

export default function SubscriptionPlansManager() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<PlanForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPlans(await subscriptionService.getPartnerPlans({ includeInactive: true }));
    } catch (reason) {
      setMessage({
        type: 'error',
        text: reason instanceof Error ? reason.message : 'No se pudieron cargar los planes.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEditor = (plan: SubscriptionPlan) => {
    const limits = resolvePartnerPlanLimits(plan);
    setEditing(plan);
    setForm({
      name: plan.name || '',
      description: plan.description || '',
      price_monthly: String(plan.price_monthly || 0),
      price_yearly: String(plan.price_yearly || 0),
      currency: plan.currency || 'UYU',
      trial_days: String(plan.trial_days || 0),
      max_businesses: limits.maxBusinesses === null ? '' : String(limits.maxBusinesses),
      max_services: limits.maxServices === null ? '' : String(limits.maxServices),
      max_products: limits.maxProducts === null ? '' : String(limits.maxProducts),
      max_promotions: limits.maxPromotions === null ? '' : String(limits.maxPromotions),
      is_active: plan.is_active,
      is_recommended: Boolean(plan.is_recommended),
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !form) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await subscriptionService.updatePlan(editing.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        price_monthly: Number(form.price_monthly || 0),
        price_yearly: Number(form.price_yearly || 0),
        currency: form.currency.trim().toUpperCase() || 'UYU',
        trial_days: Math.max(0, Number(form.trial_days || 0)),
        limits: {
          ...(editing.limits || {}),
          partners: {
            max_businesses: toLimit(form.max_businesses),
            max_services: toLimit(form.max_services),
            max_products: toLimit(form.max_products),
            max_promotions: toLimit(form.max_promotions),
          },
        },
        is_active: form.is_active,
        is_recommended: form.is_recommended,
      });
      setPlans((current) => current.map((plan) => (plan.id === updated.id ? updated : plan)));
      setEditing(null);
      setForm(null);
      setMessage({
        type: 'success',
        text: 'Plan guardado. Los aliados verán los precios y límites actualizados.',
      });
    } catch (reason) {
      setMessage({
        type: 'error',
        text: reason instanceof Error ? reason.message : 'No se pudo guardar el plan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const sync = async (plan: SubscriptionPlan) => {
    setSyncing(plan.id);
    setMessage(null);
    try {
      const updated = await subscriptionService.syncPlan(plan.id);
      setPlans((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage({ type: 'success', text: `${plan.name} quedó sincronizado con Mercado Pago.` });
    } catch (reason) {
      setMessage({
        type: 'error',
        text: reason instanceof Error ? reason.message : 'No se pudo sincronizar Mercado Pago.',
      });
    } finally {
      setSyncing(null);
    }
  };

  if (loading) return <div className="text-center py-12">Cargando planes de aliados...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2D6A6F]/15 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#4B9991]">
              Monetización SaaS
            </p>
            <h3 className="mt-1 text-2xl font-bold text-[#183432]">Planes para aliados</h3>
            <p className="mt-2 max-w-3xl text-sm text-[#58716d]">
              DogCatiFy cobra la suscripción. Las ventas y reservas se pagan directamente al aliado.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D6A6F]/25 px-4 py-3 font-semibold text-[#2D6A6F]"
          >
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl border p-4 text-sm ${
          message.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const tier = normalizePartnerPlanTier(plan.tier || plan.name);
          const definition = getPartnerPlan(tier);
          const limits = resolvePartnerPlanLimits(plan);
          const mpConnected = Boolean(
            plan.mercadopago_monthly_plan_id || plan.mercadopago_yearly_plan_id,
          );

          return (
            <article
              key={plan.id}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              style={{ borderColor: definition.border }}
            >
              <div className="p-6" style={{ backgroundColor: definition.surface }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-[.14em]" style={{ color: definition.accent }}>
                      {plan.is_recommended ? 'Recomendado' : definition.badgeText}
                    </span>
                    <h4 className="mt-2 text-2xl font-bold text-[#183432]">{plan.name}</h4>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white" style={{ color: definition.accent }}>
                    <ShieldCheck />
                  </span>
                </div>
                <p className="mt-3 min-h-14 text-sm text-[#58716d]">{plan.description}</p>
              </div>
              <div className="space-y-5 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div><small className="text-gray-500">Mensual</small><strong className="block text-lg text-[#183432]">{money(plan.price_monthly, plan.currency)}</strong></div>
                  <div><small className="text-gray-500">Anual</small><strong className="block text-lg text-[#183432]">{money(plan.price_yearly, plan.currency)}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {buildPartnerLimitSummary(limits).map((limit) => (
                    <span key={limit.key} className="rounded-xl bg-gray-50 p-3">
                      <small className="block text-gray-500">{limit.label}</small>
                      <strong className="text-sm text-[#183432]">{limit.value}</strong>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 font-semibold ${plan.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                    {plan.is_active ? 'Visible' : 'Inactivo'}
                  </span>
                  <span className={`rounded-full px-3 py-1 font-semibold ${mpConnected ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'}`}>
                    {mpConnected ? 'Mercado Pago conectado' : 'Mercado Pago pendiente'}
                  </span>
                  {plan.trial_days > 0 && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800">
                      {plan.trial_days} días de prueba
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditor(plan)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D6A6F] px-4 py-3 font-bold text-white"
                  >
                    <Edit3 size={17} /> Editar
                  </button>
                  <button
                    disabled={syncing === plan.id}
                    onClick={() => sync(plan)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2D6A6F]/25 px-4 py-3 font-bold text-[#2D6A6F] disabled:opacity-50"
                  >
                    <CreditCard size={17} /> {syncing === plan.id ? 'Sincronizando…' : 'Sincronizar MP'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {editing && form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#183432]/65 p-4">
          <form
            onSubmit={save}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#fffdf8] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#2D6A6F]/15 bg-[#fffdf8]/95 px-6 py-5 backdrop-blur">
              <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#4B9991]">Plan de aliado</p><h3 className="text-2xl font-bold text-[#183432]">Editar {editing.name}</h3></div>
              <button type="button" onClick={() => { setEditing(null); setForm(null); }} className="rounded-full p-2 text-[#58716d] hover:bg-[#DCEBE7]"><X /></button>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <Field label="Nombre"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
              <Field label="Moneda"><input required value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} /></Field>
              <div className="md:col-span-2"><Field label="Descripción"><textarea required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div>
              <Field label="Precio mensual"><input type="number" min="0" value={form.price_monthly} onChange={(event) => setForm({ ...form, price_monthly: event.target.value })} /></Field>
              <Field label="Precio anual"><input type="number" min="0" value={form.price_yearly} onChange={(event) => setForm({ ...form, price_yearly: event.target.value })} /></Field>
              <Field label="Días de prueba"><input type="number" min="0" value={form.trial_days} onChange={(event) => setForm({ ...form, trial_days: event.target.value })} /></Field>
              <div />
              <Field label="Negocios máximos"><input type="number" min="0" placeholder="Vacío = sin límite" value={form.max_businesses} onChange={(event) => setForm({ ...form, max_businesses: event.target.value })} /></Field>
              <Field label="Servicios máximos"><input type="number" min="0" placeholder="Vacío = sin límite" value={form.max_services} onChange={(event) => setForm({ ...form, max_services: event.target.value })} /></Field>
              <Field label="Productos máximos"><input type="number" min="0" placeholder="Vacío = sin límite" value={form.max_products} onChange={(event) => setForm({ ...form, max_products: event.target.value })} /></Field>
              <Field label="Promociones máximas"><input type="number" min="0" placeholder="Vacío = sin límite" value={form.max_promotions} onChange={(event) => setForm({ ...form, max_promotions: event.target.value })} /></Field>
              <Toggle label="Plan visible" checked={form.is_active} onChange={(value) => setForm({ ...form, is_active: value })} />
              <Toggle label="Plan recomendado" checked={form.is_recommended} onChange={(value) => setForm({ ...form, is_recommended: value })} />
            </div>
            <div className="flex justify-end gap-3 border-t border-[#2D6A6F]/15 p-6">
              <button type="button" onClick={() => { setEditing(null); setForm(null); }} className="rounded-xl border border-[#2D6A6F]/25 px-5 py-3 font-bold text-[#2D6A6F]">Cancelar</button>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A6F] px-5 py-3 font-bold text-white disabled:opacity-50">
                {saving ? <RefreshCw className="animate-spin" size={17} /> : <Save size={17} />}
                {saving ? 'Guardando…' : 'Guardar plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#183432]">
      {label}
      <span className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-[#2D6A6F]/25 [&>input]:bg-white [&>input]:px-4 [&>input]:py-3 [&>input]:font-normal [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-[#2D6A6F]/25 [&>textarea]:bg-white [&>textarea]:px-4 [&>textarea]:py-3 [&>textarea]:font-normal">
        {children}
      </span>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-[#DCEBE7]/55 p-4 font-bold text-[#183432]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#2D6A6F]"
      />
      {checked ? <Check size={18} /> : null}
      {label}
    </label>
  );
}
