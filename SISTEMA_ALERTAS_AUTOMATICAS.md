# Sistema de Alertas Automáticas

## Descripción

El sistema de alertas automáticas monitorea continuamente los logs de auditoría y envía notificaciones por email cuando se detectan patrones anormales o se superan umbrales configurados.

## Componentes

### 1. Edge Function: `check-alert-thresholds`

**Ubicación:** `supabase/functions/check-alert-thresholds/index.ts`

**Función:** Verifica todos los tipos de alertas configuradas y envía notificaciones cuando se cumplen las condiciones.

**Características:**
- Revisa configuración en `admin_settings` tabla
- Verifica cooldown para evitar spam
- Cuenta errores en ventana de tiempo configurable
- Envía emails usando la función `send-email`
- Registra todas las acciones en `audit_logs`

**Tipos de Alertas Monitoreadas:**
- `authentication_failures`: Fallos de login
- `api_errors`: Errores 5xx de API
- `database_errors`: Errores de conexión DB
- `payment_errors`: Errores de pagos
- `suspicious_activity`: Actividad sospechosa

### 2. Cron Job: `check-alert-thresholds`

**Ubicación:** Configurado en PostgreSQL usando `pg_cron`

**Frecuencia:** Cada 5 minutos

**Función:** Llama automáticamente a la edge function `check-alert-thresholds`

**Query Schedule:** `*/5 * * * *`

## Correcciones Aplicadas

### Bug 1: Envío con 0 Errores

**Problema:** El sistema enviaba alertas aunque el conteo de errores fuera 0.

**Solución:** Agregada validación en ambas funciones:

```typescript
// En alerts.service.ts (línea 201-205)
if (errorCount < threshold.threshold_count) {
  console.log(`No se envía alerta: errorCount=${errorCount} < threshold=${threshold.threshold_count}`);
  return;
}

// En check-alert-thresholds/index.ts (línea 165-169)
if (errorCount < threshold.threshold_count) {
  console.log(`No se envía alerta: errorCount=${errorCount} < threshold=${threshold.threshold_count}`);
  return false;
}
```

### Bug 2: Patrón "login|auth" No Funciona

**Problema:** El patrón con pipe "|" buscaba literalmente "login|auth" en lugar de hacer OR.

**Solución:**
- Cambiado a patrón simple: `"login"`
- Actualizada configuración en base de datos
- Funciona correctamente con PostgreSQL `ILIKE`

## Configuración del Cron Job

### Estado Actual

El cron job está **configurado y activo** en la base de datos:

```sql
SELECT * FROM cron.job WHERE jobname = 'check-alert-thresholds';
```

**Resultado:**
- `jobid`: 1
- `schedule`: `*/5 * * * *`
- `command`: `SELECT check_alert_thresholds_cron();`
- `active`: true ✅

### Función PostgreSQL

```sql
CREATE FUNCTION check_alert_thresholds_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
...
PERFORM net.http_post(
  url := 'https://hpvzjuionqvgxlvhyqgz.supabase.co/functions/v1/check-alert-thresholds',
  ...
);
...
$$;
```

## Opciones de Ejecución

### Opción 1: Cron Job Automático (Recomendado)

**Estado:** Configurado y activo

**Ventajas:**
- Completamente automático
- Se ejecuta cada 5 minutos
- No requiere intervención manual
- Registra ejecuciones en `audit_logs`

**Desventajas:**
- Requiere configurar service role key en PostgreSQL
- Puede tener límites de ejecución dependiendo del plan de Supabase

**Verificación:**
```sql
-- Ver logs de ejecución del cron
SELECT *
FROM audit_logs
WHERE action = 'CRON_ALERT_CHECK'
ORDER BY created_at DESC
LIMIT 10;
```

### Opción 2: Webhook Externo

Si el cron job no funciona correctamente, puedes usar un servicio externo como:

#### GitHub Actions (Gratis)

Crea `.github/workflows/alert-check.yml`:

```yaml
name: Check Alert Thresholds

on:
  schedule:
    - cron: '*/5 * * * *'  # Cada 5 minutos
  workflow_dispatch:  # Permite ejecución manual

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            'https://hpvzjuionqvgxlvhyqgz.supabase.co/functions/v1/check-alert-thresholds' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

**Configuración:**
1. Ve a tu repositorio en GitHub
2. Settings → Secrets → Actions
3. Agrega `SUPABASE_SERVICE_ROLE_KEY`

#### Vercel Cron (Gratis hasta cierto límite)

Crea `api/cron/check-alerts.ts`:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch(
    'https://hpvzjuionqvgxlvhyqgz.supabase.co/functions/v1/check-alert-thresholds',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  const data = await response.json();
  return res.status(200).json(data);
}

export const config = {
  cron: '*/5 * * * *', // Cada 5 minutos
};
```

#### EasyCron.com (Gratis hasta 20 tareas)

1. Registrarse en https://www.easycron.com/
2. Crear nuevo cron job:
   - URL: `https://hpvzjuionqvgxlvhyqgz.supabase.co/functions/v1/check-alert-thresholds`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
   - Frequency: `*/5 * * * *`

### Opción 3: Manual desde Dashboard

**Uso:** Para pruebas o casos donde no se requiere automatización completa

**Pasos:**
1. Ve a Admin Dashboard → Seguridad → Alertas
2. Click en "Probar Alerta" en cualquier tipo de alerta
3. El sistema verificará TODAS las alertas, no solo la que clickeaste

## Cómo Probar el Sistema

### Prueba Manual Completa

1. **Genera errores de prueba:**
   ```bash
   # Desde la consola del navegador (ventana de incógnito)
   for (let i = 0; i < 3; i++) {
     await fetch('/api/auth/login', {
       method: 'POST',
       body: JSON.stringify({
         email: 'test@example.com',
         password: 'wrong'
       })
     });
   }
   ```

2. **Verifica logs:**
   ```sql
   SELECT COUNT(*)
   FROM audit_logs
   WHERE success = false
     AND action ILIKE '%login%'
     AND created_at >= NOW() - INTERVAL '5 minutes';
   ```

3. **Llama manualmente la función:**
   ```bash
   curl -X POST \
     'https://hpvzjuionqvgxlvhyqgz.supabase.co/functions/v1/check-alert-thresholds' \
     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```

4. **Verifica resultado:**
   ```sql
   -- Ver si se envió alerta
   SELECT *
   FROM audit_logs
   WHERE action = 'ALERT_SENT'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

### Verificar Cron Job

```sql
-- Ver ejecuciones del cron
SELECT *
FROM audit_logs
WHERE action = 'CRON_ALERT_CHECK'
ORDER BY created_at DESC
LIMIT 10;

-- Ver próxima ejecución programada
SELECT
  jobname,
  schedule,
  active,
  last_run,
  next_run
FROM cron.job_run_details
WHERE jobname = 'check-alert-thresholds'
ORDER BY start_time DESC
LIMIT 1;
```

## Configuración de Alertas

### Estructura en `admin_settings`

```json
{
  "authentication_failures": {
    "enabled": true,
    "alert_type": "authentication_failures",
    "alert_name": "Fallos de Autenticación",
    "error_pattern": "login",
    "threshold_count": 10,
    "time_window_minutes": 15,
    "cooldown_minutes": 60,
    "severity": "HIGH",
    "notify_email": "admin@dogcatify.com"
  }
}
```

### Parámetros

- `enabled`: Activa/desactiva la alerta
- `error_pattern`: Patrón para buscar en logs (simple, sin pipe)
- `threshold_count`: Número mínimo de errores para disparar
- `time_window_minutes`: Ventana de tiempo para contar errores
- `cooldown_minutes`: Tiempo mínimo entre alertas del mismo tipo
- `severity`: LOW, MEDIUM, HIGH, CRITICAL
- `notify_email`: Destinatario de la alerta

## Monitoreo y Debugging

### Ver Logs de Alertas

```sql
-- Alertas enviadas
SELECT
  created_at,
  resource_id AS alert_id,
  details->>'alert_type' AS tipo,
  details->>'error_count' AS conteo,
  details->>'severity' AS severidad
FROM audit_logs
WHERE action = 'ALERT_SENT'
ORDER BY created_at DESC;

-- Alertas fallidas
SELECT
  created_at,
  error_message,
  details->>'alert_type' AS tipo
FROM audit_logs
WHERE action = 'ALERT_FAILED'
ORDER BY created_at DESC;

-- Ejecuciones del cron
SELECT
  created_at,
  success,
  error_message,
  details
FROM audit_logs
WHERE action = 'CRON_ALERT_CHECK'
ORDER BY created_at DESC;
```

### Deshabilitar Temporalmente

```sql
-- Desactivar cron job
SELECT cron.unschedule('check-alert-thresholds');

-- Reactivar
SELECT cron.schedule(
  'check-alert-thresholds',
  '*/5 * * * *',
  $$SELECT check_alert_thresholds_cron();$$
);

-- Desactivar alerta específica
UPDATE admin_settings
SET value = jsonb_set(
  value::jsonb,
  '{authentication_failures,enabled}',
  'false'::jsonb
)
WHERE key = 'alert_config';
```

## Troubleshooting

### Problema: Cron no se ejecuta

**Verificar:**
```sql
SELECT * FROM cron.job WHERE jobname = 'check-alert-thresholds';
```

**Si `active = false`:**
```sql
UPDATE cron.job
SET active = true
WHERE jobname = 'check-alert-thresholds';
```

### Problema: No se envían emails

**Verificar:**
1. Edge function `check-alert-thresholds` desplegada
2. Edge function `send-email` desplegada
3. Service role key configurado correctamente
4. Errores en `audit_logs` con `action = 'ALERT_FAILED'`

### Problema: Demasiadas alertas

**Ajustar cooldown:**
```sql
UPDATE admin_settings
SET value = jsonb_set(
  value::jsonb,
  '{authentication_failures,cooldown_minutes}',
  '120'::jsonb
)
WHERE key = 'alert_config';
```

## Mejores Prácticas

1. **Umbrales Realistas:** No configurar umbrales demasiado bajos
2. **Cooldowns Adecuados:** Evitar spam con cooldowns de 30-60 minutos
3. **Patrones Simples:** Usar patrones de una palabra como "login", "payment"
4. **Monitoreo Regular:** Revisar logs de alertas semanalmente
5. **Testing:** Probar cambios manualmente antes de depender del cron

## Estado Final

- ✅ Edge function corregida y desplegada
- ✅ Cron job configurado y activo
- ✅ Función PostgreSQL creada
- ✅ Validación de errorCount agregada
- ✅ Patrón "login" funcionando correctamente
- ✅ Logs de auditoría implementados
- ✅ Cooldown para prevenir spam
- ⚠️  Requiere service role key en PostgreSQL (o usar webhook externo)

## Próximos Pasos

1. **Esperar 5 minutos** y verificar que el cron se ejecutó:
   ```sql
   SELECT * FROM audit_logs
   WHERE action = 'CRON_ALERT_CHECK'
   ORDER BY created_at DESC LIMIT 1;
   ```

2. **Si no se ejecuta automáticamente:**
   - Configurar webhook externo (GitHub Actions recomendado)
   - O llamar manualmente desde el dashboard

3. **Monitorear durante 24 horas** para confirmar funcionamiento

4. **Ajustar umbrales** según necesidad basándose en los logs reales
