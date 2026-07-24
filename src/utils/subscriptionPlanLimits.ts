import { normalizePartnerPlanTier, type PartnerPlanTier } from './partnerPlans';

export type SubscriptionAudienceTarget = 'users' | 'partners' | 'all';

export interface PartnerPlanLimits {
  maxBusinesses: number | null;
  maxServices: number | null;
  maxProducts: number | null;
  maxPromotions: number | null;
}

export interface SubscriptionPlanRowLike {
  tier?: string | null;
  audience_target?: SubscriptionAudienceTarget | null;
  limits?: Record<string, unknown> | null;
}

const DEFAULT_PARTNER_LIMITS_BY_TIER: Record<PartnerPlanTier, PartnerPlanLimits> = {
  starter: { maxBusinesses: 1, maxServices: 5, maxProducts: 10, maxPromotions: 1 },
  growth: { maxBusinesses: 3, maxServices: 20, maxProducts: 40, maxPromotions: 3 },
  pro: { maxBusinesses: null, maxServices: null, maxProducts: null, maxPromotions: null },
};

const toNullableInteger = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.trunc(parsed));
};

export const resolvePartnerPlanLimits = (row?: SubscriptionPlanRowLike | null): PartnerPlanLimits => {
  const tier = normalizePartnerPlanTier(row?.tier);
  const defaults = DEFAULT_PARTNER_LIMITS_BY_TIER[tier];
  const limitGroups = row?.limits || {};
  const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const raw = asRecord(
    limitGroups.partners ??
      limitGroups.partner ??
      limitGroups.business ??
      limitGroups.businesses,
  );

  return {
    maxBusinesses: toNullableInteger(raw.max_businesses ?? raw.maxBusinesses ?? defaults.maxBusinesses),
    maxServices: toNullableInteger(raw.max_services ?? raw.maxServices ?? defaults.maxServices),
    maxProducts: toNullableInteger(raw.max_products ?? raw.maxProducts ?? defaults.maxProducts),
    maxPromotions: toNullableInteger(raw.max_promotions ?? raw.maxPromotions ?? defaults.maxPromotions),
  };
};

export const formatLimitValue = (value: number | null | undefined) =>
  value === null || value === undefined ? 'Sin límite' : value.toLocaleString('es-UY');

export const buildPartnerLimitSummary = (limits: PartnerPlanLimits) => [
  { key: 'businesses', label: 'Negocios', value: formatLimitValue(limits.maxBusinesses) },
  { key: 'services', label: 'Servicios', value: formatLimitValue(limits.maxServices) },
  { key: 'products', label: 'Productos', value: formatLimitValue(limits.maxProducts) },
  { key: 'promotions', label: 'Promociones', value: formatLimitValue(limits.maxPromotions) },
];
