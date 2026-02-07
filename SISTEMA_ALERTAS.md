# Sistema de Alertas Automáticas DogCatify

## Descripción General

Sistema completo de monitoreo y alertas que detecta anomalías en la aplicación y envía notificaciones por email automáticamente cuando se superan umbrales configurables.

## Características

✅ **Monitoreo en tiempo real** de errores en audit_logs
✅ **5 tipos de alertas predefinidas** configurables
✅ **Umbrales personalizables** para cada tipo de alerta
✅ **Cooldown inteligente** para evitar spam de notificaciones
✅ **Emails automáticos** con detalles de la anomalía
✅ **Panel de configuración** en el dashboard de administrador
✅ **Pruebas manuales** de alertas desde el panel

## Tipos de Alertas Disponibles

### 1. Errores de Pago (CRITICAL)
- **Umbral por defecto**: 5 errores en 10 minutos
- **Patrón**: payment
- **Cooldown**: 30 minutos
- Detecta problemas con Mercado Pago, links de pago, etc.

### 2. Errores de Base de Datos (CRITICAL)
- **Umbral por defecto**: 5 errores en 5 minutos
- **Patrón**: database|connection|timeout
- **Cooldown**: 30 minutos
- Detecta problemas de conexión, timeouts, queries fallidos

### 3. Fallos de Autenticación (HIGH)
- **Umbral por defecto**: 10 errores en 15 minutos
- **Patrón**: login|auth
- **Cooldown**: 60 minutos
- Detecta intentos de login fallidos, problemas de sesión

### 4. Errores de API - 5xx (HIGH)
- **Umbral por defecto**: 8 errores en 10 minutos
- **Patrón**: 5xx|500|502|503
- **Cooldown**: 30 minutos
- Detecta errores del servidor, APIs caídas

### 5. Actividad Sospechosa (MEDIUM)
- **Umbral por defecto**: 15 errores en 30 minutos
- **Cooldown**: 120 minutos
- Detecta patrones anormales generales

## Configuración

### Acceso al Panel

1. Ir a **Dashboard Admin** → **Seguridad** → **Alertas**
2. Verás todas las alertas configuradas con sus parámetros

### Parámetros Configurables

Para cada tipo de alerta puedes ajustar:

- **Habilitado/Deshabilitado**: Toggle on/off
- **Umbral de errores**: Número de errores necesarios para disparar la alerta
- **Ventana de tiempo**: Minutos en los que se cuentan los errores (1-120 min)
- **Cooldown**: Tiempo mínimo entre alertas del mismo tipo (5-480 min)
- **Email de notificación**: Destinatario de las alertas

### Ejemplo de Configuración

```
Alerta: Errores de Pago
- Umbral: 5 errores
- Ventana: 10 minutos
- Cooldown: 30 minutos
- Email: admin@dogcatify.com

Significado: Si hay 5+ errores relacionados con pagos en 10 minutos,
enviar email a admin@dogcatify.com. No enviar otra alerta del mismo
tipo hasta que pasen 30 minutos.
```

## Email de Alerta

Cuando se dispara una alerta, se envía un email con el template `admin_system_anomaly_alert` que incluye:

### Información de la Alerta
- **ID de Alerta**: ALT-YYYYMMDD-XXXXX
- **Severidad**: LOW | MEDIUM | HIGH | CRITICAL
- **Tipo de Anomalía**: Nombre descriptivo
- **Fecha/Hora de Detección**: Con timezone -03
- **Duración**: Tiempo de la ventana de monitoreo
- **Estado**: DETECTADO | EN INVESTIGACIÓN

### Métricas y Detalles
- **Resumen**: Descripción de qué se detectó
- **Impacto**: Usuarios afectados y consecuencias
- **Métricas clave**: Conteo de errores, tasa, latencia
- **Causa sospechada**: Primer mensaje de error capturado
- **Correlation ID**: Para rastrear en logs

### Links Útiles
- **Runbook URL**: Documentación de procedimientos
- **Dashboard URL**: Link directo al panel de seguridad
- **Logs URL**: Link a los logs de auditoría
- **Acción requerida**: Pasos recomendados
- **Asignado a**: Equipo responsable

### Ejemplo de JSON Enviado

```json
{
  "template_name": "admin_system_anomaly_alert",
  "recipient_email": "admin@dogcatify.com",
  "subject": "🚨 [ALERTA CRITICAL] Errores de Pago | DogCatiFy",
  "alert_id": "ALT-20260207-00087",
  "wait_for_invoice": false,
  "data": {
    "environment": "PROD",
    "severity": "CRITICAL",
    "service": "payment-errors",
    "anomaly_type": "Errores de Pago",
    "detected_at": "07/02/2026 22:41 (-03)",
    "duration": "10 min",
    "status": "DETECTADO",
    "summary": "Se detectaron 8 errores de tipo 'Errores de Pago' en los últimos 10 minutos. Umbral configurado: 5 errores.",
    "impact": "3 usuarios afectados. Posible degradación del servicio.",
    "key_metrics": "Errores: 8 | Ventana: 10min | Umbral: 5",
    "suspected_cause": "Error connecting to Mercado Pago API",
    "correlation_id": "corr-alt-20260207-00087",
    "reference": "ALT-20260207-00087",
    "runbook_url": "https://dogcatify.com/runbooks/payment_errors",
    "dashboard_url": "https://dogcatify.com/admin/seguridad",
    "logs_url": "https://dogcatify.com/admin/seguridad?tab=logs",
    "action_required": "Revisar logs de auditoría y determinar causa raíz. Escalar si persiste más de 30 minutos.",
    "assigned_to": "Admin DogCatify",
    "support_email": "soporte@dogcatify.com",
    "year": "2026"
  }
}
```

## Monitoreo Automático

### Edge Function: check-alert-thresholds

Se ha desplegado una función edge que verifica todos los umbrales:

**URL**: `{SUPABASE_URL}/functions/v1/check-alert-thresholds`

Esta función:
1. Lee la configuración de alertas desde admin_settings
2. Para cada alerta habilitada:
   - Verifica si está en cooldown
   - Cuenta errores en audit_logs según el patrón y ventana de tiempo
   - Si supera el umbral, envía email de alerta
   - Registra la alerta enviada para respetar el cooldown

### Ejecución Automática (Recomendado)

Para que las alertas se revisen automáticamente, se recomienda configurar un cron job o webhook que llame a la función periódicamente:

#### Opción 1: Cron Job en Supabase

```sql
-- Crear extensión pg_cron si no existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Ejecutar cada 5 minutos
SELECT cron.schedule(
  'check-alert-thresholds',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='YOUR_SUPABASE_URL/functions/v1/check-alert-thresholds',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

#### Opción 2: Servicio Externo (cron-job.org, etc.)

Configurar un cron externo que haga POST a:
```
POST {SUPABASE_URL}/functions/v1/check-alert-thresholds
Headers:
  Authorization: Bearer {SERVICE_ROLE_KEY}
  Content-Type: application/json
```

### Ejecución Manual

Desde el panel de Alertas, puedes hacer clic en **"Probar Alerta"** para:
- Verificar si el umbral actual dispararía una alerta
- Enviar un email de prueba si se supera el umbral
- Ver si la alerta está en cooldown

## Integración con Audit Logs

El sistema funciona analizando la tabla `audit_logs`:

```sql
SELECT COUNT(*) FROM audit_logs
WHERE success = false
  AND created_at >= NOW() - INTERVAL '10 minutes'
  AND (
    error_message ILIKE '%payment%' OR
    action ILIKE '%payment%' OR
    resource_type ILIKE '%payment%'
  );
```

**IMPORTANTE**: Para que las alertas funcionen, debes:
1. Tener la tabla `audit_logs` creada (ver CREATE_AUDIT_LOGS_TABLE.sql)
2. Registrar errores usando `logError()` o `auditService.log()` con `success: false`

## Buenas Prácticas

### 1. Ajustar Umbrales Gradualmente

Empieza con umbrales conservadores y ajústalos según:
- Volumen de tráfico real
- Tasa de errores normal de tu aplicación
- Falsos positivos recibidos

### 2. Configurar Cooldowns Apropiados

- **Alertas críticas**: 15-30 minutos
- **Alertas importantes**: 30-60 minutos
- **Alertas informativas**: 60-120 minutos

Evita cooldowns muy cortos que generen spam.

### 3. Usar Diferentes Emails Según Severidad

```
CRITICAL → oncall@dogcatify.com (alertas inmediatas)
HIGH → admin@dogcatify.com (seguimiento rápido)
MEDIUM → reports@dogcatify.com (revisión diaria)
```

### 4. Revisar Alertas Periódicamente

- Verifica que las alertas se envían correctamente
- Revisa los logs de "ALERT_SENT" y "ALERT_FAILED" en audit_logs
- Ajusta patrones si hay muchos falsos positivos

### 5. Documentar Runbooks

Crea documentación de procedimientos para cada tipo de alerta:
- Pasos de diagnóstico
- Acciones de mitigación
- Contactos de escalación

## Troubleshooting

### Las alertas no se envían

**Verificar**:
1. ¿La tabla audit_logs existe y tiene datos?
2. ¿Hay errores con `success = false` en el rango de tiempo?
3. ¿La alerta está habilitada en la configuración?
4. ¿Está en periodo de cooldown?
5. ¿El email de destino es válido?
6. ¿La función send-email está funcionando?

**Logs**: Revisar `audit_logs` buscando `action = 'ALERT_FAILED'`

### Demasiadas alertas (spam)

**Soluciones**:
1. Aumentar el umbral de errores
2. Aumentar el cooldown
3. Refinar el patrón de error para ser más específico
4. Considerar deshabilitar temporalmente

### Email no llega

**Verificar**:
1. Template `admin_system_anomaly_alert` existe en send-email
2. Credenciales de email están configuradas
3. Email no está en spam
4. Verificar logs de la función send-email

## Monitoreo del Sistema de Alertas

El sistema se auto-monitorea:
- Cada alerta enviada crea un log con `action = 'ALERT_SENT'`
- Cada fallo crea un log con `action = 'ALERT_FAILED'`
- Puedes crear una meta-alerta para monitorear `ALERT_FAILED` 😄

## Próximas Mejoras

- [ ] Dashboard de métricas de alertas
- [ ] Integración con Slack/Discord
- [ ] Alertas basadas en tendencias (no solo umbrales)
- [ ] Machine Learning para detectar anomalías
- [ ] Agregación de alertas similares
- [ ] Resolución automática de alertas

## Soporte

Para más información:
- Código: `src/services/alerts.service.ts`
- Componente: `src/components/admin/SecurityManager.tsx` (pestaña Alertas)
- Edge Function: `supabase/functions/check-alert-thresholds/index.ts`
- Audit System: `SISTEMA_AUDITORIA.md`
