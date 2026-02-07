import { supabase } from '../lib/supabase';
import { auditService } from './audit.service';

export interface AlertThreshold {
  id?: string;
  alert_type: string;
  alert_name: string;
  threshold_count: number;
  time_window_minutes: number;
  error_pattern?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  notify_email: string;
  cooldown_minutes: number;
}

export interface AlertConfig {
  payment_errors: AlertThreshold;
  database_errors: AlertThreshold;
  authentication_failures: AlertThreshold;
  api_errors: AlertThreshold;
  suspicious_activity: AlertThreshold;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  payment_errors: {
    alert_type: 'payment_errors',
    alert_name: 'Errores de Pago',
    threshold_count: 5,
    time_window_minutes: 10,
    error_pattern: 'payment',
    severity: 'CRITICAL',
    enabled: true,
    notify_email: 'admin@dogcatify.com',
    cooldown_minutes: 30
  },
  database_errors: {
    alert_type: 'database_errors',
    alert_name: 'Errores de Base de Datos',
    threshold_count: 5,
    time_window_minutes: 5,
    error_pattern: 'database|connection|timeout',
    severity: 'CRITICAL',
    enabled: true,
    notify_email: 'admin@dogcatify.com',
    cooldown_minutes: 30
  },
  authentication_failures: {
    alert_type: 'authentication_failures',
    alert_name: 'Fallos de Autenticación',
    threshold_count: 10,
    time_window_minutes: 15,
    error_pattern: 'login',
    severity: 'HIGH',
    enabled: true,
    notify_email: 'admin@dogcatify.com',
    cooldown_minutes: 60
  },
  api_errors: {
    alert_type: 'api_errors',
    alert_name: 'Errores de API (5xx)',
    threshold_count: 8,
    time_window_minutes: 10,
    error_pattern: '5xx|500|502|503',
    severity: 'HIGH',
    enabled: true,
    notify_email: 'admin@dogcatify.com',
    cooldown_minutes: 30
  },
  suspicious_activity: {
    alert_type: 'suspicious_activity',
    alert_name: 'Actividad Sospechosa',
    threshold_count: 15,
    time_window_minutes: 30,
    severity: 'MEDIUM',
    enabled: true,
    notify_email: 'admin@dogcatify.com',
    cooldown_minutes: 120
  }
};

export const alertsService = {
  async getAlertConfig(): Promise<AlertConfig> {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'alert_config')
        .maybeSingle();

      if (error) throw error;

      if (data && data.value) {
        return { ...DEFAULT_ALERT_CONFIG, ...data.value };
      }

      return DEFAULT_ALERT_CONFIG;
    } catch (error) {
      console.error('Error loading alert config:', error);
      return DEFAULT_ALERT_CONFIG;
    }
  },

  async saveAlertConfig(config: AlertConfig): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'alert_config',
          value: config,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving alert config:', error);
      throw error;
    }
  },

  async checkThresholds(): Promise<void> {
    const config = await this.getAlertConfig();

    for (const [key, threshold] of Object.entries(config)) {
      if (!threshold.enabled) continue;

      const shouldAlert = await this.checkThreshold(threshold);
      if (shouldAlert) {
        await this.sendAlert(threshold, key);
      }
    }
  },

  async checkThreshold(threshold: AlertThreshold): Promise<boolean> {
    try {
      const timeWindow = new Date();
      timeWindow.setMinutes(timeWindow.getMinutes() - threshold.time_window_minutes);

      const { data: recentAlerts } = await supabase
        .from('admin_settings')
        .select('value, updated_at')
        .eq('key', `last_alert_${threshold.alert_type}`)
        .maybeSingle();

      if (recentAlerts && recentAlerts.updated_at) {
        const lastAlertTime = new Date(recentAlerts.updated_at);
        const cooldownEnd = new Date(lastAlertTime);
        cooldownEnd.setMinutes(cooldownEnd.getMinutes() + threshold.cooldown_minutes);

        if (new Date() < cooldownEnd) {
          return false;
        }
      }

      let query = supabase
        .from('audit_logs')
        .select('id', { count: 'exact' })
        .eq('success', false)
        .gte('created_at', timeWindow.toISOString());

      if (threshold.error_pattern) {
        query = query.or(
          `error_message.ilike.%${threshold.error_pattern}%,action.ilike.%${threshold.error_pattern}%,resource_type.ilike.%${threshold.error_pattern}%`
        );
      }

      const { count, error } = await query;

      if (error) throw error;

      return (count || 0) >= threshold.threshold_count;
    } catch (error) {
      console.error('Error checking threshold:', error);
      return false;
    }
  },

  async sendAlert(threshold: AlertThreshold, alertKey: string): Promise<void> {
    try {
      const timeWindow = new Date();
      timeWindow.setMinutes(timeWindow.getMinutes() - threshold.time_window_minutes);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('success', false)
        .gte('created_at', timeWindow.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (threshold.error_pattern) {
        query = query.or(
          `error_message.ilike.%${threshold.error_pattern}%,action.ilike.%${threshold.error_pattern}%,resource_type.ilike.%${threshold.error_pattern}%`
        );
      }

      const { data: recentErrors } = await query;

      const errorCount = recentErrors?.length || 0;

      if (errorCount < threshold.threshold_count) {
        console.log(`[sendAlert] No se envía alerta: errorCount=${errorCount} < threshold=${threshold.threshold_count}`);
        return;
      }

      const uniqueUsers = new Set(recentErrors?.map(e => e.user_email).filter(Boolean)).size;
      const errorMessages = recentErrors?.slice(0, 5).map(e => e.error_message).filter(Boolean) || [];

      const detectedAt = new Date();
      const alertId = `ALT-${detectedAt.getFullYear()}${String(detectedAt.getMonth() + 1).padStart(2, '0')}${String(detectedAt.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

      const emailPayload = {
        template_name: 'admin_system_anomaly_alert',
        recipient_email: threshold.notify_email,
        subject: `🚨 [ALERTA ${threshold.severity}] ${threshold.alert_name} | DogCatiFy`,
        alert_id: alertId,
        wait_for_invoice: false,
        data: {
          environment: 'PROD',
          severity: threshold.severity,
          service: threshold.alert_type.replace(/_/g, '-'),
          anomaly_type: threshold.alert_name,
          detected_at: detectedAt.toLocaleString('es-UY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Montevideo'
          }),
          duration: `${threshold.time_window_minutes} min`,
          status: 'DETECTADO',
          summary: `Se detectaron ${errorCount} errores de tipo "${threshold.alert_name}" en los últimos ${threshold.time_window_minutes} minutos. Umbral configurado: ${threshold.threshold_count} errores.`,
          impact: `${uniqueUsers} usuarios afectados. Posible degradación del servicio.`,
          key_metrics: `Errores: ${errorCount} | Ventana: ${threshold.time_window_minutes}min | Umbral: ${threshold.threshold_count}`,
          suspected_cause: errorMessages.length > 0 ? errorMessages[0] : 'En investigación',
          correlation_id: `corr-${alertId.toLowerCase()}`,
          reference: alertId,
          runbook_url: `${import.meta.env.VITE_SUPABASE_URL || 'https://dogcatify.com'}/runbooks/${threshold.alert_type}`,
          dashboard_url: `${import.meta.env.VITE_SUPABASE_URL || 'https://dogcatify.com'}/admin/seguridad`,
          logs_url: `${import.meta.env.VITE_SUPABASE_URL || 'https://dogcatify.com'}/admin/seguridad?tab=logs`,
          action_required: `Revisar logs de auditoría y determinar causa raíz. Escalar si persiste más de ${threshold.cooldown_minutes} minutos.`,
          assigned_to: 'Admin DogCatify',
          support_email: 'soporte@dogcatify.com',
          year: new Date().getFullYear().toString()
        }
      };

      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send alert email: ${response.statusText}`);
      }

      await supabase
        .from('admin_settings')
        .upsert({
          key: `last_alert_${threshold.alert_type}`,
          value: {
            alert_id: alertId,
            error_count: errorCount,
            timestamp: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      await auditService.log({
        action: 'ALERT_SENT',
        resource_type: 'system_alert',
        resource_id: alertId,
        user_email_override: threshold.notify_email,
        details: {
          alert_type: threshold.alert_type,
          severity: threshold.severity,
          error_count: errorCount,
          recipient: threshold.notify_email,
          threshold_count: threshold.threshold_count,
          time_window_minutes: threshold.time_window_minutes
        }
      });

    } catch (error) {
      console.error('Error sending alert:', error);
      await auditService.log({
        action: 'ALERT_FAILED',
        resource_type: 'system_alert',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_email_override: threshold.notify_email,
        details: {
          alert_type: threshold.alert_type,
          severity: threshold.severity,
          recipient: threshold.notify_email,
          error_stack: error instanceof Error ? error.stack : undefined
        }
      });
    }
  },

  async manualCheck(alertType: string): Promise<{ triggered: boolean; message: string; details?: any }> {
    const config = await this.getAlertConfig();
    const threshold = config[alertType as keyof AlertConfig];

    if (!threshold) {
      return { triggered: false, message: 'Tipo de alerta no encontrado' };
    }

    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - threshold.time_window_minutes);

    console.log('=== MANUAL ALERT CHECK ===');
    console.log('Alert Type:', alertType);
    console.log('Pattern:', threshold.error_pattern);
    console.log('Threshold:', threshold.threshold_count);
    console.log('Time Window:', threshold.time_window_minutes, 'minutes');
    console.log('Looking since:', timeWindow.toISOString());
    console.log('Current time:', new Date().toISOString());

    let query = supabase
      .from('audit_logs')
      .select('id, action, error_message, resource_type, created_at', { count: 'exact' })
      .eq('success', false)
      .gte('created_at', timeWindow.toISOString());

    if (threshold.error_pattern) {
      query = query.or(
        `error_message.ilike.%${threshold.error_pattern}%,action.ilike.%${threshold.error_pattern}%,resource_type.ilike.%${threshold.error_pattern}%`
      );
    }

    const { count, data, error } = await query;

    console.log('Query Result:', {
      count,
      dataLength: data?.length,
      error,
      sample: data?.slice(0, 3)
    });
    console.log('=== END ALERT CHECK ===');

    if (error) {
      return {
        triggered: false,
        message: `Error al consultar logs: ${error.message}`,
        details: { error: error.message }
      };
    }

    const errorCount = count || 0;
    const shouldAlert = errorCount >= threshold.threshold_count;

    if (shouldAlert) {
      try {
        await this.sendAlert(threshold, alertType);
        return {
          triggered: true,
          message: `Alerta enviada. Se encontraron ${errorCount} errores (umbral: ${threshold.threshold_count})`,
          details: {
            errorCount,
            threshold: threshold.threshold_count,
            recentErrors: data?.slice(0, 5)
          }
        };
      } catch (sendError: any) {
        return {
          triggered: true,
          message: `Se alcanzó el umbral pero falló el envío: ${sendError.message}`,
          details: {
            errorCount,
            threshold: threshold.threshold_count,
            sendError: sendError.message
          }
        };
      }
    }

    const message = errorCount === 0
      ? `No se encontraron errores con el patrón "${threshold.error_pattern}" en los últimos ${threshold.time_window_minutes} minutos. Genera nuevos fallos de login para probar la alerta.`
      : `No se alcanzó el umbral. Se encontraron ${errorCount} errores de ${threshold.threshold_count} necesarios en los últimos ${threshold.time_window_minutes} minutos`;

    return {
      triggered: false,
      message,
      details: {
        errorCount,
        threshold: threshold.threshold_count,
        timeWindow: threshold.time_window_minutes,
        timeWindowStart: timeWindow.toISOString(),
        currentTime: new Date().toISOString(),
        pattern: threshold.error_pattern,
        recentErrors: data?.slice(0, 5),
        explanation: errorCount === 0
          ? 'No hay errores recientes en la ventana de tiempo. Los errores deben ocurrir dentro de la ventana de tiempo configurada para activar la alerta.'
          : 'Se encontraron algunos errores pero no alcanzan el umbral configurado.'
      }
    };
  }
};
