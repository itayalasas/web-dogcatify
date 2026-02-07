# Guía de Setup: Sistema de Seguridad y Alertas

## Resumen

DogCatify ahora cuenta con un sistema completo de auditoría y alertas automáticas que:

✅ Registra todas las transacciones y acciones importantes
✅ Detecta anomalías en tiempo real
✅ Envía emails automáticos cuando se superan umbrales
✅ Panel de administración para configurar alertas
✅ Pruebas manuales de alertas desde el dashboard

## Paso 1: Crear Tabla de Auditoría

**CRÍTICO**: Este paso es obligatorio para que todo funcione.

### Opción A: Usando Supabase Dashboard

1. Ir a Supabase Dashboard
2. Navegar a **SQL Editor**
3. Abrir el archivo `CREATE_AUDIT_LOGS_TABLE.sql` en la raíz del proyecto
4. Copiar todo el contenido
5. Pegarlo en SQL Editor
6. Hacer clic en **Run**

### Opción B: Verificar si ya existe

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'audit_logs'
  AND table_schema = 'public'
);
```

Si devuelve `false`, ejecutar el script del paso A.

## Paso 2: Verificar Edge Functions

Las siguientes funciones edge ya están desplegadas:

✅ `create-payment-link` - Generar links de Mercado Pago
✅ `mercadopago-webhook` - Webhook de pagos
✅ `check-alert-thresholds` - Monitoreo de alertas (NUEVA)

Para verificar:
```
Supabase Dashboard → Edge Functions
```

## Paso 3: Configurar Alertas

1. Ir a **Dashboard Admin** (requiere `is_admin = true`)
2. Navegar a **Seguridad** → **Alertas**
3. Revisar y ajustar los umbrales según tu aplicación:

### Configuración Recomendada Inicial

| Alerta | Umbral | Ventana | Cooldown | Email |
|--------|--------|---------|----------|-------|
| Errores de Pago | 5 | 10 min | 30 min | admin@dogcatify.com |
| Errores de BD | 5 | 5 min | 30 min | admin@dogcatify.com |
| Fallos de Auth | 10 | 15 min | 60 min | admin@dogcatify.com |
| Errores API 5xx | 8 | 10 min | 30 min | admin@dogcatify.com |
| Actividad Sospechosa | 15 | 30 min | 120 min | admin@dogcatify.com |

4. Hacer clic en **"Guardar Configuración de Alertas"**

## Paso 4: Probar el Sistema

### Probar Auditoría

El sistema ya registra automáticamente:
- Acceso al dashboard de admin
- Cambio de secciones en el admin
- Logout desde el admin

Para ver los logs:
1. Ir a **Seguridad** → **Registro de Actividad**
2. Deberías ver logs de tus acciones recientes

### Probar Alertas Manualmente

1. Ir a **Seguridad** → **Alertas**
2. Seleccionar cualquier alerta habilitada
3. Hacer clic en **"Probar Alerta"**
4. Si hay suficientes errores en audit_logs, recibirás un email

### Generar Errores de Prueba (Opcional)

Para probar que las alertas funcionan:

```typescript
import { logError } from './services/audit.service';

// Generar varios errores de pago de prueba
for (let i = 0; i < 6; i++) {
  logError('PAYMENT_FAILED', 'Error de prueba en Mercado Pago', {
    test: true,
    attempt: i
  });
}
```

Luego hacer clic en "Probar Alerta" en "Errores de Pago".

## Paso 5: Configurar Monitoreo Automático

Para que las alertas se revisen cada 5 minutos automáticamente:

### Opción A: Cron Job en Supabase (Recomendado)

```sql
-- Ejecutar en SQL Editor de Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'check-alert-thresholds',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='TU_SUPABASE_URL/functions/v1/check-alert-thresholds',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer TU_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

Reemplazar:
- `TU_SUPABASE_URL` con tu URL de Supabase
- `TU_SERVICE_ROLE_KEY` con tu service role key

### Opción B: Servicio Externo

Usar cron-job.org, EasyCron, o similar para hacer POST cada 5 minutos a:

```
POST https://TU_SUPABASE_URL/functions/v1/check-alert-thresholds
Headers:
  Authorization: Bearer TU_SERVICE_ROLE_KEY
  Content-Type: application/json
Body: {}
```

## Paso 6: Integrar en tu Código

Agregar logging en componentes críticos:

### Ejemplo: Registro de Bookings

```typescript
import { logResourceAction, logError } from '../services/audit.service';

const handleCreateBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;

    // ✅ Registrar éxito
    logResourceAction('CREATE', 'booking', data.id, {
      service: bookingData.service_name,
      customer: bookingData.customer_email,
      amount: bookingData.total_amount
    });

  } catch (error) {
    // ✅ Registrar error
    logError('CREATE_BOOKING', error.message, bookingData);
    throw error;
  }
};
```

### Ejemplo: Errores de Pago

```typescript
import { logError } from '../services/audit.service';

try {
  const response = await createPaymentLink(bookingData);
  if (!response.ok) {
    throw new Error('Mercado Pago API error');
  }
} catch (error) {
  // ✅ Esto disparará la alerta "Errores de Pago" si hay 5+ en 10 min
  logError('PAYMENT_LINK_FAILED', error.message, {
    booking_id: bookingData.id,
    amount: bookingData.total_amount,
    service: 'mercadopago'
  });
}
```

## Estructura de Archivos

```
project/
├── CREATE_AUDIT_LOGS_TABLE.sql      # Script para crear tabla audit_logs
├── SISTEMA_AUDITORIA.md             # Documentación de auditoría
├── SISTEMA_ALERTAS.md               # Documentación de alertas
├── SETUP_SEGURIDAD.md               # Esta guía
│
├── src/
│   ├── services/
│   │   ├── audit.service.ts         # Servicio de auditoría
│   │   └── alerts.service.ts        # Servicio de alertas
│   │
│   └── components/
│       └── admin/
│           └── SecurityManager.tsx   # Panel de Seguridad
│
└── supabase/
    └── functions/
        └── check-alert-thresholds/
            └── index.ts              # Edge function de monitoreo
```

## Verificar que Todo Funciona

### Checklist de Verificación

- [ ] Tabla `audit_logs` creada en Supabase
- [ ] RLS habilitado en audit_logs
- [ ] Puedes ver logs en Dashboard Admin → Seguridad → Registro
- [ ] Configuración de alertas guardada correctamente
- [ ] Prueba manual de alerta funciona
- [ ] Edge function `check-alert-thresholds` desplegada
- [ ] Cron job configurado (si aplica)
- [ ] Template `admin_system_anomaly_alert` existe en send-email
- [ ] Email de prueba recibido correctamente

### Comandos de Verificación

```sql
-- Verificar que audit_logs existe
SELECT COUNT(*) FROM audit_logs;

-- Verificar RLS
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'audit_logs';

-- Ver últimos logs
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- Verificar configuración de alertas
SELECT * FROM admin_settings
WHERE key = 'alert_config';
```

## Solución de Problemas

### No veo logs en el panel

**Causa**: Tabla audit_logs no existe
**Solución**: Ejecutar CREATE_AUDIT_LOGS_TABLE.sql

### Las alertas no se envían

**Verificar**:
1. Tabla audit_logs tiene errores (`success = false`)
2. Alerta está habilitada en configuración
3. No está en periodo de cooldown
4. Email destino es válido
5. Función send-email funciona

### Email no llega

**Verificar**:
1. Template `admin_system_anomaly_alert` existe
2. Credenciales de email configuradas en send-email
3. Revisar carpeta de spam
4. Ver logs de send-email function

## Próximos Pasos

1. ✅ Setup inicial completo
2. Monitorear alertas durante 1 semana
3. Ajustar umbrales según necesidad
4. Integrar logging en más componentes
5. Crear runbooks para cada tipo de alerta
6. Configurar diferentes emails según severidad
7. Implementar limpieza de logs antiguos (90+ días)

## Soporte y Documentación

- **Auditoría**: `SISTEMA_AUDITORIA.md`
- **Alertas**: `SISTEMA_ALERTAS.md`
- **Servicio de Auditoría**: `src/services/audit.service.ts`
- **Servicio de Alertas**: `src/services/alerts.service.ts`
- **Panel Admin**: Dashboard → Seguridad

## Contacto

Para dudas o soporte:
- Email: soporte@dogcatify.com
- Admin Dashboard: /admin/seguridad
