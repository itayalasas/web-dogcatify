export type PartnerPlanTier = 'starter' | 'growth' | 'pro';

export type PartnerModule = 'clients' | 'insights' | 'adoptions' | 'priority_support';

export type PartnerSubscriptionStatus =
  | 'pending'
  | 'trialing'
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'past_due';

export interface PartnerPlanDefinition {
  tier: PartnerPlanTier;
  name: string;
  subtitle: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  trialDays: number;
  accent: string;
  surface: string;
  border: string;
  badgeText: string;
  features: string[];
  limitations: string[];
  moduleAccess: Record<PartnerModule, boolean>;
}

export interface PartnerAccountSubscriptionSource {
  subscription_plan_tier?: string | null;
  subscription_plan_status?: string | null;
  subscription_plan_expires_at?: string | null;
}

export interface PartnerAccountSubscriptionSummary {
  subscriptionPlanTier: PartnerPlanTier;
  subscriptionPlanStatus: string | null;
  subscriptionPlanExpiresAt: string | null;
}

export const PARTNER_PLAN_ORDER: PartnerPlanTier[] = ['starter', 'growth', 'pro'];

const PARTNER_PLAN_DEFINITIONS: Record<PartnerPlanTier, PartnerPlanDefinition> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    subtitle: 'Operación esencial',
    description: 'Para aliados que necesitan gestionar agenda, servicios, productos y cobros.',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'UYU',
    trialDays: 0,
    accent: '#2563EB',
    surface: '#EFF6FF',
    border: '#BFDBFE',
    badgeText: 'Base',
    features: [
      'Dashboard operativo',
      'Agenda y reservas',
      'Gestión de servicios y productos',
      'Pedidos y cobros directos con Mercado Pago',
      'Edición básica del negocio',
    ],
    limitations: [
      'No incluye clientes avanzados',
      'No incluye inteligencia comercial',
      'No incluye adopciones',
      'No incluye soporte prioritario',
    ],
    moduleAccess: {
      clients: false,
      insights: false,
      adoptions: false,
      priority_support: false,
    },
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    subtitle: 'Crecimiento y control',
    description: 'Para aliados que quieren analizar clientes y tomar mejores decisiones comerciales.',
    priceMonthly: 1490,
    priceYearly: 14900,
    currency: 'UYU',
    trialDays: 7,
    accent: '#047857',
    surface: '#ECFDF5',
    border: '#A7F3D0',
    badgeText: 'Recomendado',
    features: [
      'Todo lo del plan Starter',
      'Historial y segmento de clientes',
      'Inteligencia de negocio',
      'Analíticas de demanda y actividad',
      'Mejor soporte operativo',
    ],
    limitations: ['No incluye adopciones', 'No incluye soporte prioritario'],
    moduleAccess: {
      clients: true,
      insights: true,
      adoptions: false,
      priority_support: false,
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    subtitle: 'Operación completa',
    description: 'Para aliados que necesitan analítica avanzada, adopciones y soporte prioritario.',
    priceMonthly: 2990,
    priceYearly: 29900,
    currency: 'UYU',
    trialDays: 14,
    accent: '#7C3AED',
    surface: '#F5F3FF',
    border: '#DDD6FE',
    badgeText: 'Avanzado',
    features: [
      'Todo lo del plan Growth',
      'Gestión de contactos de adopción',
      'Insights avanzados y localización',
      'Soporte prioritario',
      'Configuración comercial completa',
    ],
    limitations: [],
    moduleAccess: {
      clients: true,
      insights: true,
      adoptions: true,
      priority_support: true,
    },
  },
};

export const DEFAULT_PARTNER_PLAN_TIER: PartnerPlanTier = 'starter';

export const normalizePartnerPlanTier = (value?: string | null): PartnerPlanTier => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'starter' || normalized === 'free') return 'starter';
  if (normalized === 'growth' || normalized === 'standard' || normalized === 'plus') return 'growth';
  if (normalized === 'pro' || normalized === 'premium') return 'pro';
  return DEFAULT_PARTNER_PLAN_TIER;
};

export const getPartnerPlan = (value?: string | null): PartnerPlanDefinition => {
  const plan = PARTNER_PLAN_DEFINITIONS[normalizePartnerPlanTier(value)];
  return {
    ...plan,
    features: [...plan.features],
    limitations: [...plan.limitations],
    moduleAccess: { ...plan.moduleAccess },
  };
};

export const getPartnerPlanDisplayPrice = (
  value?: string | null,
  cadence: 'monthly' | 'yearly' = 'monthly',
) => {
  const plan = getPartnerPlan(value);
  const amount = cadence === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  return amount === 0 ? 'Gratis' : `${amount.toLocaleString('es-UY')} ${plan.currency}`;
};

const getTimestampOrNull = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

export const isPartnerSubscriptionCurrent = (status?: string | null, expiresAt?: string | null) => {
  const normalizedStatus = String(status || '').toLowerCase();
  const expiresAtTimestamp = getTimestampOrNull(expiresAt);
  const hasFutureAccess = expiresAtTimestamp ? expiresAtTimestamp > Date.now() : false;

  return (
    normalizedStatus === 'pending' ||
    normalizedStatus === 'trialing' ||
    normalizedStatus === 'active' ||
    normalizedStatus === 'paused' ||
    (normalizedStatus === 'cancelled' && hasFutureAccess)
  );
};

export const resolvePartnerPlanTier = (
  planTier?: string | null,
  subscriptionStatus?: string | null,
  expiresAt?: string | null,
) => {
  const tier = normalizePartnerPlanTier(planTier);
  const status = String(subscriptionStatus || '').toLowerCase();
  const expiresAtTimestamp = getTimestampOrNull(expiresAt);
  const hasFutureAccess = expiresAtTimestamp ? expiresAtTimestamp > Date.now() : false;

  if (!status) return tier;
  if (status === 'pending') return DEFAULT_PARTNER_PLAN_TIER;

  if (status === 'trialing' || status === 'active') {
    if (expiresAtTimestamp && expiresAtTimestamp <= Date.now()) return DEFAULT_PARTNER_PLAN_TIER;
    return tier;
  }

  if (['paused', 'cancelled', 'expired', 'past_due'].includes(status)) {
    return hasFutureAccess ? tier : DEFAULT_PARTNER_PLAN_TIER;
  }

  return tier;
};

export const resolvePartnerAccountSubscription = <T extends PartnerAccountSubscriptionSource>(
  rows: T[],
): PartnerAccountSubscriptionSummary | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const ranked = rows.map((row) => {
    const resolvedTier = resolvePartnerPlanTier(
      row.subscription_plan_tier,
      row.subscription_plan_status,
      row.subscription_plan_expires_at,
    );

    return {
      row,
      resolvedTier,
      resolvedIndex: PARTNER_PLAN_ORDER.indexOf(resolvedTier),
      isCurrent: isPartnerSubscriptionCurrent(
        row.subscription_plan_status,
        row.subscription_plan_expires_at,
      ),
    };
  });

  const candidates = ranked.some((item) => item.isCurrent)
    ? ranked.filter((item) => item.isCurrent)
    : ranked;
  const best = candidates.reduce<(typeof ranked)[number] | null>((winner, item) => {
    if (!winner || item.resolvedIndex > winner.resolvedIndex) return item;
    return winner;
  }, null);

  if (!best) return null;

  return {
    subscriptionPlanTier: best.resolvedTier,
    subscriptionPlanStatus: best.row.subscription_plan_status || null,
    subscriptionPlanExpiresAt: best.row.subscription_plan_expires_at || null,
  };
};

export const getPartnerSubscriptionStatusLabel = (
  subscriptionStatus?: string | null,
  expiresAt?: string | null,
) => {
  const status = String(subscriptionStatus || '').toLowerCase();
  const expiresAtTimestamp = getTimestampOrNull(expiresAt);
  const hasFutureAccess = expiresAtTimestamp ? expiresAtTimestamp > Date.now() : false;

  if (status === 'trialing') return 'Prueba activa';
  if (status === 'pending') return 'Pendiente de pago';
  if (status === 'paused') return hasFutureAccess ? 'Pausada hasta vencimiento' : 'Pausada';
  if (status === 'cancelled') return hasFutureAccess ? 'Cancelada hasta vencimiento' : 'Cancelada';
  if (status === 'expired') return 'Vencida';
  if (status === 'past_due') return 'Pago pendiente';
  return 'Activa';
};

export const canAccessPartnerModule = (
  planTier?: string | null,
  module?: PartnerModule,
  businessType?: string,
  subscriptionStatus?: string | null,
  expiresAt?: string | null,
) => {
  if (!module) return true;
  const plan = getPartnerPlan(resolvePartnerPlanTier(planTier, subscriptionStatus, expiresAt));
  if (module === 'adoptions') {
    return plan.moduleAccess.adoptions && businessType === 'shelter';
  }
  return plan.moduleAccess[module];
};

export const getPartnerLockedActionLabel = (module: PartnerModule) => {
  if (module === 'clients' || module === 'insights') return 'Disponible desde Growth';
  if (module === 'adoptions' || module === 'priority_support') return 'Disponible en Pro';
  return 'Requiere actualizar el plan';
};
