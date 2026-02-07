import { supabase } from '../lib/supabase';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface CreateAuditLogParams {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  success?: boolean;
  error_message?: string;
  user_email_override?: string;
  ip_address?: string;
  user_agent?: string;
}

export const auditService = {
  async log(params: CreateAuditLogParams) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const logEntry = {
        user_id: user?.id || null,
        user_email: params.user_email_override || user?.email || null,
        action: params.action,
        resource_type: params.resource_type || null,
        resource_id: params.resource_id || null,
        details: params.details || {},
        success: params.success !== undefined ? params.success : true,
        error_message: params.error_message || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Error creating audit log:', error);
      }
    } catch (error) {
      console.error('Error in audit service:', error);
    }
  },

  async getLogs(limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data as AuditLog[];
    } catch (error) {
      console.error('Error loading audit logs:', error);
      return [];
    }
  },

  async getLogsByUser(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLog[];
    } catch (error) {
      console.error('Error loading user audit logs:', error);
      return [];
    }
  },

  async getLogsByAction(action: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', action)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLog[];
    } catch (error) {
      console.error('Error loading action audit logs:', error);
      return [];
    }
  },

  async getLogsByResourceType(resourceType: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', resourceType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLog[];
    } catch (error) {
      console.error('Error loading resource audit logs:', error);
      return [];
    }
  },

  async searchLogs(searchTerm: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`user_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,resource_type.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditLog[];
    } catch (error) {
      console.error('Error searching audit logs:', error);
      return [];
    }
  }
};

export const logAction = (action: string, details?: any) => {
  auditService.log({ action, details });
};

export const logResourceAction = (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any
) => {
  auditService.log({ action, resource_type: resourceType, resource_id: resourceId, details });
};

export const logError = (
  action: string,
  errorMessage: string,
  details?: any,
  userEmail?: string
) => {
  auditService.log({
    action,
    success: false,
    error_message: errorMessage,
    details,
    user_email_override: userEmail
  });
};
