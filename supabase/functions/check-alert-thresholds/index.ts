import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AlertThreshold {
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

interface AlertConfig {
  [key: string]: AlertThreshold;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: configData, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'alert_config')
      .maybeSingle();

    if (configError) throw configError;

    if (!configData || !configData.value) {
      return new Response(
        JSON.stringify({ message: 'No alert configuration found' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200
        }
      );
    }

    const alertConfig: AlertConfig = configData.value;
    const results = [];

    for (const [key, threshold] of Object.entries(alertConfig)) {
      if (!threshold.enabled) {
        continue;
      }

      const shouldAlert = await checkThreshold(supabase, threshold);

      if (shouldAlert.triggered) {
        const alertSent = await sendAlert(supabase, threshold, key, shouldAlert.errorCount);
        results.push({
          alert_type: key,
          triggered: true,
          sent: alertSent,
          error_count: shouldAlert.errorCount
        });
      } else {
        results.push({
          alert_type: key,
          triggered: false,
          error_count: shouldAlert.errorCount
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Alert check completed',
        results
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error checking alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500
      }
    );
  }
});

async function checkThreshold(supabase: any, threshold: AlertThreshold): Promise<{ triggered: boolean; errorCount: number }> {
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
        return { triggered: false, errorCount: 0 };
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

    const errorCount = count || 0;
    return {
      triggered: errorCount >= threshold.threshold_count,
      errorCount
    };
  } catch (error) {
    console.error('Error checking threshold:', error);
    return { triggered: false, errorCount: 0 };
  }
}

async function sendAlert(supabase: any, threshold: AlertThreshold, alertKey: string, errorCount: number): Promise<boolean> {
  try {
    if (errorCount < threshold.threshold_count) {
      console.log(`[sendAlert] No se envía alerta: errorCount=${errorCount} < threshold=${threshold.threshold_count}`);
      return false;
    }

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

    const uniqueUsers = new Set(recentErrors?.map((e: any) => e.user_email).filter(Boolean)).size;
    const errorMessages = recentErrors?.slice(0, 5).map((e: any) => e.error_message).filter(Boolean) || [];

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
        runbook_url: `${Deno.env.get('SUPABASE_URL')}/runbooks/${threshold.alert_type}`,
        dashboard_url: `${Deno.env.get('SUPABASE_URL')}/admin/seguridad`,
        logs_url: `${Deno.env.get('SUPABASE_URL')}/admin/seguridad?tab=logs`,
        action_required: `Revisar logs de auditoría y determinar causa raíz. Escalar si persiste más de ${threshold.cooldown_minutes} minutos.`,
        assigned_to: 'Admin DogCatify',
        support_email: 'soporte@dogcatify.com',
        year: new Date().getFullYear().toString()
      }
    };

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
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

    await supabase
      .from('audit_logs')
      .insert({
        action: 'ALERT_SENT',
        resource_type: 'system_alert',
        resource_id: alertId,
        success: true,
        details: {
          alert_type: threshold.alert_type,
          severity: threshold.severity,
          error_count: errorCount,
          recipient: threshold.notify_email
        }
      });

    return true;
  } catch (error) {
    console.error('Error sending alert:', error);

    await supabase
      .from('audit_logs')
      .insert({
        action: 'ALERT_FAILED',
        resource_type: 'system_alert',
        success: false,
        error_message: error.message || 'Unknown error',
        details: {
          alert_type: threshold.alert_type
        }
      });

    return false;
  }
}
