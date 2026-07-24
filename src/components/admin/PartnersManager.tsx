import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  CreditCard,
  Crown,
  Edit2,
  Eye,
  MapPin,
  Phone,
  Star,
  Store,
  ToggleLeft,
  ToggleRight,
  X,
  XCircle,
} from 'lucide-react';
import { partnersService, type Partner } from '../../services/admin.service';
import { subscriptionService } from '../../services/subscription.service';
import {
  PARTNER_PLAN_ORDER,
  getPartnerPlan,
  getPartnerSubscriptionStatusLabel,
  resolvePartnerAccountSubscription,
  type PartnerPlanTier,
  type PartnerSubscriptionStatus,
} from '../../utils/partnerPlans';
import PartnerProfileModal from './PartnerProfileModal';

type AccountPlanEditor = {
  partner: Partner;
  tier: PartnerPlanTier;
  status: PartnerSubscriptionStatus;
  expiresAt: string;
};

const toDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const PartnersManager = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [planEditor, setPlanEditor] = useState<AccountPlanEditor | null>(null);

  const partnersByUser = useMemo(
    () =>
      partners.reduce<Record<string, Partner[]>>((groups, partner) => {
        const key = String(partner.user_id || partner.id);
        groups[key] = [...(groups[key] || []), partner];
        return groups;
      }, {}),
    [partners],
  );

  const loadPartners = async () => {
    try {
      setLoading(true);
      setPartners(await partnersService.getAll());
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPartners();
  }, []);

  const getAccountPlan = (partner: Partner) =>
    resolvePartnerAccountSubscription(partnersByUser[String(partner.user_id || partner.id)] || [
      partner,
    ]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await partnersService.toggleActive(id, !currentStatus);
      await loadPartners();
    } catch (error) {
      console.error('Error toggling partner:', error);
      alert('Error al cambiar el estado del aliado');
    }
  };

  const handleToggleVerified = async (id: string, currentStatus: boolean) => {
    try {
      await partnersService.toggleVerified(id, !currentStatus);
      await loadPartners();
    } catch (error) {
      console.error('Error toggling verification:', error);
      alert('Error al cambiar la verificación del aliado');
    }
  };

  const openPlanEditor = (partner: Partner) => {
    const subscription = getAccountPlan(partner);
    setPlanEditor({
      partner,
      tier: subscription?.subscriptionPlanTier || 'starter',
      status:
        (subscription?.subscriptionPlanStatus as PartnerSubscriptionStatus | null) || 'active',
      expiresAt: toDateInput(subscription?.subscriptionPlanExpiresAt),
    });
  };

  const saveAccountPlan = async () => {
    if (!planEditor?.partner.user_id) {
      alert('Este aliado no tiene una cuenta asociada.');
      return;
    }

    setSavingPlan(true);
    try {
      await subscriptionService.updateAccountPlan(planEditor.partner.user_id, {
        tier: planEditor.tier,
        status: planEditor.status,
        expiresAt:
          planEditor.tier === 'starter' || !planEditor.expiresAt
            ? null
            : new Date(`${planEditor.expiresAt}T23:59:59`).toISOString(),
      });
      setPlanEditor(null);
      await loadPartners();
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      alert('No se pudo actualizar el plan de la cuenta.');
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center">Cargando aliados...</div>;
  }

  return (
    <div>
      {selectedPartner && (
        <PartnerProfileModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onSaved={() => {
            setSelectedPartner(null);
            void loadPartners();
          }}
        />
      )}

      {planEditor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#102b2b]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between bg-gradient-to-r from-[#2D6A6F] to-[#4B9991] p-6 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-white/70">
                  Suscripción por cuenta
                </p>
                <h4 className="mt-1 text-xl font-bold">{planEditor.partner.business_name}</h4>
                <p className="mt-1 text-sm text-white/80">
                  El cambio se aplicará a todos sus negocios.
                </p>
              </div>
              <button
                onClick={() => setPlanEditor(null)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {PARTNER_PLAN_ORDER.map((tier) => {
                    const plan = getPartnerPlan(tier);
                    const active = planEditor.tier === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => setPlanEditor((current) => current && { ...current, tier })}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-[#2D6A6F] bg-[#EAF5F2] ring-2 ring-[#2D6A6F]/15'
                            : 'border-gray-200 hover:border-[#4B9991]'
                        }`}
                      >
                        <strong className="block text-sm text-[#183432]">{plan.name}</strong>
                        <small className="text-gray-500">{plan.subtitle}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Estado</label>
                  <select
                    value={planEditor.status}
                    onChange={(event) =>
                      setPlanEditor((current) =>
                        current
                          ? {
                              ...current,
                              status: event.target.value as PartnerSubscriptionStatus,
                            }
                          : current,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-[#2D6A6F] focus:outline-none focus:ring-2 focus:ring-[#2D6A6F]/15"
                  >
                    <option value="active">Activa</option>
                    <option value="trialing">Prueba</option>
                    <option value="pending">Pendiente</option>
                    <option value="paused">Pausada</option>
                    <option value="past_due">Pago vencido</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="expired">Expirada</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Acceso hasta
                  </label>
                  <input
                    type="date"
                    disabled={planEditor.tier === 'starter'}
                    value={planEditor.expiresAt}
                    onChange={(event) =>
                      setPlanEditor((current) =>
                        current ? { ...current, expiresAt: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                Las ventas continúan acreditándose directamente en Mercado Pago del aliado.
                DogCatiFy monetiza esta cuenta mediante su suscripción.
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPlanEditor(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  disabled={savingPlan}
                  onClick={saveAccountPlan}
                  className="rounded-xl bg-[#2D6A6F] px-5 py-2.5 font-bold text-white disabled:opacity-50"
                >
                  {savingPlan ? 'Guardando…' : 'Guardar plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-semibold text-gray-800">Gestión de Aliados</h3>
        <p className="text-gray-600">
          Administra perfiles, verificación y suscripciones por cuenta de aliado.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {['Negocio', 'Tipo', 'Contacto', 'Rating', 'Plan de cuenta', 'Estado', 'Acciones'].map(
                  (label) => (
                    <th
                      key={label}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {partners.map((partner) => {
                const subscription = getAccountPlan(partner);
                const plan = getPartnerPlan(subscription?.subscriptionPlanTier);
                const accountBusinessCount =
                  partnersByUser[String(partner.user_id || partner.id)]?.length || 1;

                return (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.business_name}
                            className="mr-3 h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                            <Store className="h-5 w-5 text-teal-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {partner.business_name}
                          </div>
                          <div className="text-xs text-gray-500">{partner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs capitalize text-blue-800">
                        {partner.business_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        {partner.phone && (
                          <div className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {partner.phone}
                          </div>
                        )}
                        {partner.address && (
                          <div className="flex items-start">
                            <MapPin className="mr-1 mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">{partner.address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Star className="mr-1 h-4 w-4 fill-current text-yellow-500" />
                        <span className="text-sm text-gray-900">
                          {partner.rating?.toFixed(1) || 'N/A'}
                        </span>
                        <span className="ml-1 text-xs text-gray-500">
                          ({partner.reviews_count || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg"
                          style={{ color: plan.accent, backgroundColor: plan.surface }}
                        >
                          <Crown size={16} />
                        </span>
                        <div>
                          <strong className="block text-sm text-gray-900">{plan.name}</strong>
                          <span className="block text-xs text-gray-500">
                            {getPartnerSubscriptionStatusLabel(
                              subscription?.subscriptionPlanStatus,
                              subscription?.subscriptionPlanExpiresAt,
                            )}
                          </span>
                          {accountBusinessCount > 1 && (
                            <span className="block text-xs text-[#2D6A6F]">
                              {accountBusinessCount} negocios
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => openPlanEditor(partner)}
                          className="ml-1 text-blue-600 hover:text-blue-700"
                          title="Editar plan de la cuenta"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {partner.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                            <XCircle className="mr-1 h-3 w-3" /> Inactivo
                          </span>
                        )}
                        <div>
                          {partner.is_verified ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                              <CheckCircle className="mr-1 h-3 w-3" /> Verificado
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                              Sin verificar
                            </span>
                          )}
                        </div>
                        {partner.mercadopago_connected && (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
                            <CreditCard className="mr-1 h-3 w-3" /> MP conectado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedPartner(partner)}
                          className="inline-flex items-center justify-center rounded bg-[#DCEBE7] px-3 py-1 text-xs text-[#2D6A6F] transition-colors hover:bg-[#cfe4df]"
                        >
                          <Eye className="mr-1 h-4 w-4" /> Ver perfil
                        </button>
                        <button
                          onClick={() =>
                            handleToggleActive(partner.id, partner.is_active || false)
                          }
                          className="inline-flex items-center justify-center rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          {partner.is_active ? (
                            <ToggleRight className="mr-1 h-4 w-4" />
                          ) : (
                            <ToggleLeft className="mr-1 h-4 w-4" />
                          )}
                          {partner.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleVerified(partner.id, partner.is_verified || false)
                          }
                          className="inline-flex items-center justify-center rounded bg-blue-100 px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200"
                        >
                          {partner.is_verified ? 'Quitar verif.' : 'Verificar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {partners.length === 0 && (
        <div className="py-12 text-center text-gray-500">No hay aliados registrados</div>
      )}
    </div>
  );
};

export default PartnersManager;
