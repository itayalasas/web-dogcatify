import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  CalendarDays,
  Check,
  Crown,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Partner } from '../../services/admin.service';
import {
  subscriptionService,
  type BillingCycle,
  type PartnerSubscription,
  type SubscriptionPlan,
} from '../../services/subscription.service';
import {
  getPartnerPlan,
  getPartnerSubscriptionStatusLabel,
  isPartnerSubscriptionCurrent,
  normalizePartnerPlanTier,
  resolvePartnerAccountSubscription,
} from '../../utils/partnerPlans';
import {
  buildPartnerLimitSummary,
  resolvePartnerPlanLimits,
} from '../../utils/subscriptionPlanLimits';

const money = (value: number, currency = 'UYU') =>
  value === 0
    ? 'Gratis'
    : new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value);

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-UY') : 'Sin vencimiento';

const tierFromPlan = (plan?: SubscriptionPlan | null) =>
  normalizePartnerPlanTier(plan?.tier || plan?.name);

export default function PartnerSubscriptionManager({
  partners,
  onChanged,
}: {
  partners: Partner[];
  onChanged: () => void;
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<PartnerSubscription[]>([]);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const verifiedPartners = useMemo(
    () => partners.filter((partner) => partner.is_verified),
    [partners],
  );
  const partnerIds = useMemo(
    () => verifiedPartners.map((partner) => partner.id),
    [verifiedPartners],
  );
  const accountSubscription = resolvePartnerAccountSubscription(
    verifiedPartners.length ? verifiedPartners : partners,
  );
  const currentTier = accountSubscription?.subscriptionPlanTier || 'starter';
  const currentPlan =
    plans.find((plan) => tierFromPlan(plan) === currentTier) ||
    plans.find((plan) => tierFromPlan(plan) === 'starter') ||
    null;
  const anchorPartnerId = verifiedPartners[0]?.id || partners[0]?.id || null;

  const currentSubscription = useMemo(() => {
    const current = subscriptions.find((subscription) =>
      isPartnerSubscriptionCurrent(
        subscription.status,
        subscription.expires_at || subscription.trial_ends_at,
      ),
    );
    return current || subscriptions[0] || null;
  }, [subscriptions]);

  const currentAccessEndsAt =
    currentSubscription?.expires_at ||
    currentSubscription?.trial_ends_at ||
    accountSubscription?.subscriptionPlanExpiresAt ||
    null;
  const hasCurrentPaidAccess =
    currentTier !== 'starter' &&
    isPartnerSubscriptionCurrent(
      currentSubscription?.status || accountSubscription?.subscriptionPlanStatus,
      currentAccessEndsAt,
    );
  const trialAlreadyUsed = subscriptions.some((subscription) => subscription.trial_used);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [planRows, subscriptionRows] = await Promise.all([
        subscriptionService.getPartnerPlans(),
        subscriptionService.getPartnerSubscriptions(partnerIds),
      ]);
      setPlans(planRows);
      setSubscriptions(subscriptionRows);
    } catch (reason) {
      setMessage({
        type: 'error',
        text: reason instanceof Error ? reason.message : 'No se pudieron cargar las suscripciones.',
      });
    } finally {
      setLoading(false);
    }
  }, [partnerIds]);

  useEffect(() => {
    void load();
  }, [load]);

  const startPlan = async (plan: SubscriptionPlan) => {
    if (!anchorPartnerId) return;
    const nextTier = tierFromPlan(plan);

    if (hasCurrentPaidAccess && nextTier !== currentTier) {
      setMessage({
        type: 'error',
        text: 'Primero debes cancelar el plan actual o esperar a que finalice el período contratado.',
      });
      return;
    }

    setProcessing(plan.id);
    setMessage(null);
    try {
      const result = await subscriptionService.startPartnerSubscription(
        anchorPartnerId,
        plan.id,
        cycle,
      );
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      setMessage({ type: 'success', text: 'El plan quedó activo para toda tu cuenta de aliado.' });
      await load();
      onChanged();
    } catch (reason) {
      setMessage({
        type: 'error',
        text: reason instanceof Error ? reason.message : 'No se pudo iniciar la suscripción.',
      });
    } finally {
      setProcessing(null);
    }
  };

  const cancelCurrent = async () => {
    if (!anchorPartnerId || !currentSubscription) return;
    if (!window.confirm('La baja conservará el acceso hasta el vencimiento actual. ¿Deseas continuar?')) {
      return;
    }

    setProcessing(currentSubscription.id);
    setMessage(null);
    try {
      await subscriptionService.cancelPartnerSubscription(anchorPartnerId, currentSubscription.id);
      setMessage({
        type: 'success',
        text: 'La suscripción quedó cancelada y mantendrá el acceso hasta su vencimiento.',
      });
      await load();
      onChanged();
    } catch (reason) {
      setMessage({
        type: 'error',
        text: reason instanceof Error ? reason.message : 'No se pudo cancelar la suscripción.',
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="portal-loading">
        <span />
        <p>Cargando planes y suscripción…</p>
      </div>
    );
  }

  if (!verifiedPartners.length) {
    return (
      <section className="portal-module">
        <div className="portal-module-heading">
          <div><p>Suscripción</p><h2>Planes para aliados</h2></div>
          <span>Tu cuenta necesita al menos un negocio verificado.</span>
        </div>
        <div className="portal-empty">
          <ShieldCheck />
          <h3>Verificación pendiente</h3>
          <p>Podrás contratar y gestionar el plan cuando DogCatiFy verifique tu negocio.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="portal-module">
      <div className="portal-module-heading">
        <div><p>Suscripción de la cuenta</p><h2>Plan de aliado</h2></div>
        <span>Un único plan se aplica a todos tus negocios verificados.</span>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'portal-success' : 'portal-error'}>
          {message.text}
        </div>
      )}

      <div className="portal-subscription-current">
        <div className="portal-subscription-current-icon">
          {currentTier === 'pro' ? <Crown /> : <ShieldCheck />}
        </div>
        <div>
          <small>Plan actual</small>
          <h3>{currentPlan?.name || getPartnerPlan(currentTier).name}</h3>
          <p>
            {currentTier === 'starter'
              ? 'Plan base gratuito'
              : getPartnerSubscriptionStatusLabel(
                  currentSubscription?.status || accountSubscription?.subscriptionPlanStatus,
                  currentAccessEndsAt,
                )}
          </p>
        </div>
        <div className="portal-subscription-current-meta">
          <span><CalendarDays /> Acceso hasta {date(currentAccessEndsAt)}</span>
          <span><ShieldCheck /> {verifiedPartners.length} negocio{verifiedPartners.length === 1 ? '' : 's'} cubierto{verifiedPartners.length === 1 ? '' : 's'}</span>
        </div>
        <div className="portal-subscription-current-actions">
          {currentSubscription?.status === 'pending' && currentSubscription.payment_url && (
            <a className="portal-primary" href={currentSubscription.payment_url}>
              Continuar pago <ExternalLink />
            </a>
          )}
          {hasCurrentPaidAccess && currentSubscription?.status !== 'cancelled' && (
            <button
              className="portal-secondary"
              disabled={processing === currentSubscription?.id}
              onClick={cancelCurrent}
            >
              {processing === currentSubscription?.id ? 'Cancelando…' : 'Dar de baja'}
            </button>
          )}
          <button className="portal-icon-button" onClick={load} aria-label="Actualizar suscripción">
            <RefreshCw />
          </button>
        </div>
      </div>

      <div className="portal-cycle-selector" aria-label="Frecuencia de facturación">
        <button className={cycle === 'monthly' ? 'active' : ''} onClick={() => setCycle('monthly')}>
          Mensual
        </button>
        <button className={cycle === 'yearly' ? 'active' : ''} onClick={() => setCycle('yearly')}>
          Anual
        </button>
      </div>

      <div className="portal-plan-grid">
        {plans.map((plan) => {
          const tier = tierFromPlan(plan);
          const definition = getPartnerPlan(tier);
          const limits = resolvePartnerPlanLimits(plan);
          const isCurrent = tier === currentTier;
          const price = cycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const trialAvailable = plan.trial_days > 0 && !trialAlreadyUsed;
          const disabled =
            processing === plan.id ||
            isCurrent ||
            (hasCurrentPaidAccess && !isCurrent);

          return (
            <article
              key={plan.id}
              className={`portal-plan-card ${isCurrent ? 'is-current' : ''}`}
              style={{ '--plan-accent': definition.accent } as CSSProperties}
            >
              <div className="portal-plan-card-heading">
                <div>
                  <span>{plan.is_recommended ? 'Recomendado' : definition.badgeText}</span>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>
                {tier === 'pro' ? <Crown /> : <Sparkles />}
              </div>
              <div className="portal-plan-price">
                <strong>{money(price, plan.currency || 'UYU')}</strong>
                {price > 0 && <span>/{cycle === 'monthly' ? 'mes' : 'año'}</span>}
              </div>
              {trialAvailable && <div className="portal-trial-pill">{plan.trial_days} días de prueba</div>}
              <div className="portal-plan-features">
                {(plan.features || definition.features).slice(0, 5).map((feature) => (
                  <span key={feature}><Check /> {feature}</span>
                ))}
              </div>
              <div className="portal-plan-limits">
                {buildPartnerLimitSummary(limits).map((limit) => (
                  <span key={limit.key}><small>{limit.label}</small><strong>{limit.value}</strong></span>
                ))}
              </div>
              <button
                className="portal-primary"
                disabled={disabled}
                onClick={() => startPlan(plan)}
              >
                {processing === plan.id
                  ? 'Procesando…'
                  : isCurrent
                    ? 'Plan actual'
                    : hasCurrentPaidAccess
                      ? 'Cancela el plan actual'
                      : price === 0
                        ? 'Activar gratis'
                        : trialAvailable
                          ? `Probar ${plan.trial_days} días`
                          : 'Contratar'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
