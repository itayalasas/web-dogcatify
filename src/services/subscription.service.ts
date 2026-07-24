import { supabase } from '../lib/supabase';
import type { PartnerPlanTier, PartnerSubscriptionStatus } from '../utils/partnerPlans';

export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionAudience = 'users' | 'partners' | 'all';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: string | null;
  label?: string | null;
  audience_target?: SubscriptionAudience | null;
  audience?: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  trial_days: number;
  features: string[] | null;
  limitations?: string[] | null;
  limits?: Record<string, unknown> | null;
  entitlement_keys?: string[] | null;
  is_active: boolean;
  is_default?: boolean | null;
  is_recommended?: boolean | null;
  mercadopago_monthly_plan_id?: string | null;
  mercadopago_yearly_plan_id?: string | null;
  mercadopago_monthly_status?: string | null;
  mercadopago_yearly_status?: string | null;
  mercadopago_last_sync_at?: string | null;
  mercadopago_sync_error?: string | null;
  sort_order?: number | null;
}

export interface PartnerSubscription {
  id: string;
  partner_id: string;
  plan_id: string;
  status: string;
  billing_cycle: BillingCycle;
  trial_used?: boolean | null;
  trial_days?: number | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  expires_at?: string | null;
  canceled_at?: string | null;
  payment_url?: string | null;
  mercadopago_preapproval_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AccountPlanUpdate {
  tier: PartnerPlanTier;
  status: PartnerSubscriptionStatus;
  expiresAt?: string | null;
}

const normalizePlan = (row: Record<string, unknown>): SubscriptionPlan =>
  ({
    ...row,
    price_monthly: Number(row.price_monthly || 0),
    price_yearly: Number(row.price_yearly || 0),
    trial_days: Number(row.trial_days || 0),
    features: Array.isArray(row.features) ? row.features : [],
    limitations: Array.isArray(row.limitations) ? row.limitations : [],
    limits: row.limits && typeof row.limits === 'object' ? row.limits : {},
    entitlement_keys: Array.isArray(row.entitlement_keys) ? row.entitlement_keys : [],
  }) as SubscriptionPlan;

export const subscriptionService = {
  async getPartnerPlans(options: { includeInactive?: boolean } = {}) {
    let query = supabase
      .from('subscription_plans')
      .select('*')
      .in('audience_target', ['partners', 'all'])
      .order('sort_order', { ascending: true });

    if (!options.includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(normalizePlan);
  },

  async getPartnerSubscriptions(partnerIds: string[]) {
    if (!partnerIds.length) return [];
    const { data, error } = await supabase
      .from('partner_subscriptions')
      .select('*')
      .in('partner_id', partnerIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PartnerSubscription[];
  },

  async startPartnerSubscription(partnerId: string, planId: string, billingCycle: BillingCycle) {
    const { data, error } = await supabase.functions.invoke('create-partner-subscription', {
      body: { partnerId, planId, billingCycle },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'No se pudo iniciar la suscripción.');
    return data;
  },

  async cancelPartnerSubscription(partnerId: string, subscriptionId: string) {
    const { data, error } = await supabase.functions.invoke('cancel-partner-subscription', {
      body: { partnerId, subscriptionId },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'No se pudo cancelar la suscripción.');
    return data;
  },

  async updateAccountPlan(userId: string, update: AccountPlanUpdate) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('partners')
      .update({
        subscription_plan_tier: update.tier,
        subscription_plan_status: update.status,
        subscription_plan_started_at:
          update.status === 'active' || update.status === 'trialing' ? now : null,
        subscription_plan_expires_at:
          update.tier === 'starter' ? null : update.expiresAt || null,
        subscription_plan_metadata: {
          source: 'web-admin',
          changed_at: now,
        },
        updated_at: now,
      })
      .eq('user_id', userId)
      .select('*');

    if (error) throw error;
    return data || [];
  },

  async updatePlan(id: string, updates: Partial<SubscriptionPlan>) {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return normalizePlan(data);
  },

  async syncPlan(planId: string) {
    const traceId = `web-plan-sync-${planId.slice(0, 8)}-${Date.now()}`;
    const { data, error } = await supabase.functions.invoke('sync-subscription-plan', {
      headers: { 'x-dogcatify-trace-id': traceId },
      body: { planId, mode: 'import', traceId },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'No se pudo sincronizar Mercado Pago.');
    return normalizePlan(data.plan);
  },
};
