# Troubleshooting: Sistema de Alertas

## ⚠️ PROBLEMA COMÚN: "Se encontraron 0 errores" cuando hay logs

### Síntoma

Al probar la alerta de **Fallos de Autenticación**, muestra:
```
No se alcanzó el umbral. Se encontraron 0 errores de 2 necesarios
```

Pero en **Registro de Actividad** SÍ hay errores de `LOGIN_FAILED` visibles.

### Causa

El patrón de búsqueda (`error_pattern`) usa caracteres `|` (pipe) que NO funcionan como "OR" con PostgREST.

**Pattern INCORRECTO:**
```
LOGIN|login|auth|AUTH|credentials
```

Este pattern busca literalmente el texto completo "LOGIN|login|auth|AUTH|credentials" y NO encuentra nada.

**Pattern CORRECTO:**
```
LOGIN
```

Este pattern simple matchea: `LOGIN_FAILED`, `LOGIN_ERROR`, `LOGIN`

### Solución Rápida

1. Ir a **Dashboard Admin → Seguridad → Alertas**
2. En **Fallos de Autenticación**, cambiar:
   - **Patrón actual:** `LOGIN|login|auth|...`
   - **Patrón nuevo:** `LOGIN`
3. Hacer clic en **"Guardar Configuración de Alertas"**
4. Hacer clic en **"Probar Alerta"**

Ahora debería funcionar correctamente.

### Verificar con SQL

```sql
-- Contar errores con pattern CORRECTO
SELECT COUNT(*)
FROM audit_logs
WHERE success = false
  AND action ILIKE '%LOGIN%'
  AND created_at >= NOW() - INTERVAL '5 minutes';
```

Si este query retorna más de 0, tu alerta debería funcionar.

---

## Problema: No se envían alertas después de errores de login

### Checklist de Diagnóstico

#### 1. Verificar que la tabla audit_logs existe

```sql
SELECT COUNT(*) FROM audit_logs;
```

Si da error "relation does not exist", ejecutar `CREATE_AUDIT_LOGS_TABLE.sql`

#### 2. Verificar que se están registrando errores de login

```sql
-- Ver los últimos 10 logs de login
SELECT
  created_at,
  user_email,
  action,
  success,
  error_message,
  details
FROM audit_logs
WHERE action LIKE '%LOGIN%'
ORDER BY created_at DESC
LIMIT 10;
```

**Esperado**: Deberías ver logs con `success = false` y `action = 'LOGIN_FAILED'`

**Si no hay logs**:
- El componente Login necesita estar usando `logError()` correctamente
- Verificar que estás intentando hacer login con credenciales incorrectas
- Ver la consola del navegador para errores de JavaScript

#### 3. Verificar que los errores coinciden con el patrón de la alerta

```sql
-- Buscar errores que coincidan con el patrón de autenticación
SELECT
  created_at,
  action,
  error_message
FROM audit_logs
WHERE success = false
  AND created_at >= NOW() - INTERVAL '15 minutes'
  AND (
    error_message ILIKE '%LOGIN%' OR
    error_message ILIKE '%login%' OR
    error_message ILIKE '%auth%' OR
    error_message ILIKE '%AUTH%' OR
    error_message ILIKE '%credentials%' OR
    error_message ILIKE '%Credenciales%' OR
    action ILIKE '%LOGIN%' OR
    action ILIKE '%login%' OR
    action ILIKE '%auth%' OR
    action ILIKE '%AUTH%' OR
    resource_type ILIKE '%LOGIN%' OR
    resource_type ILIKE '%login%' OR
    resource_type ILIKE '%auth%' OR
    resource_type ILIKE '%AUTH%'
  )
ORDER BY created_at DESC;
```

**Esperado**: Deberías ver los mismos errores de login aquí.

**Si no aparecen**: El patrón de búsqueda no coincide. Ajusta el `error_pattern` en la configuración de alertas.

#### 4. Verificar configuración de la alerta

En Dashboard Admin → Seguridad → Alertas:

- ¿La alerta está **habilitada**? (toggle verde)
- ¿El **umbral** es alcanzable? (ejemplo: 2 errores, no 10)
- ¿La **ventana de tiempo** es correcta? (ejemplo: 1 minuto, no 15)
- ¿El **email** es válido?
- ¿Hay **cooldown activo**? (verifica que no se haya enviado una alerta recientemente)

**Configuración recomendada para pruebas**:
```
Umbral: 2 errores
Ventana: 1 minuto
Cooldown: 1 minuto
```

#### 5. Probar manualmente la alerta

1. Ir a Dashboard Admin → Seguridad → Alertas
2. Encontrar "Fallos de Autenticación"
3. Hacer clic en **"Probar Alerta"**
4. Abrir la consola del navegador (F12)
5. Revisar el output en la consola

**Interpretar el resultado**:

```javascript
// ✅ ÉXITO - Alerta enviada
{
  triggered: true,
  message: "Alerta enviada. Se encontraron 5 errores...",
  details: {
    errorCount: 5,
    threshold: 2,
    recentErrors: [...]
  }
}
```

```javascript
// ⚠️ UMBRAL NO ALCANZADO
{
  triggered: false,
  message: "No se alcanzó el umbral. Se encontraron 1 errores de 2 necesarios...",
  details: {
    errorCount: 1,
    threshold: 2,
    timeWindow: 1,
    pattern: "LOGIN|login|auth...",
    recentErrors: [...]
  }
}
```

```javascript
// ❌ ERROR DE CONSULTA
{
  triggered: false,
  message: "Error al consultar logs: ...",
  details: { error: "..." }
}
```

#### 6. Verificar que admin_settings guarda la configuración

```sql
-- Ver configuración de alertas
SELECT * FROM admin_settings WHERE key = 'alert_config';

-- Ver última alerta enviada (si existe)
SELECT * FROM admin_settings WHERE key LIKE 'last_alert_%';
```

**Si `alert_config` no existe**: La configuración no se guardó. Hacer clic en "Guardar Configuración de Alertas".

**Si `last_alert_authentication_failures` existe con timestamp reciente**: Estás en cooldown.

#### 7. Verificar la función send-email

```sql
-- Verificar que la función existe
SELECT * FROM audit_logs
WHERE action = 'ALERT_SENT' OR action = 'ALERT_FAILED'
ORDER BY created_at DESC
LIMIT 5;
```

**Si ves `ALERT_FAILED`**: Hay un problema con la función send-email. Ver el error_message.

**Errores comunes**:
- Template `admin_system_anomaly_alert` no existe en send-email
- Credenciales de email no configuradas
- Error de permisos/CORS

#### 8. Revisar cooldown

Si una alerta se envió recientemente, el sistema esperará el tiempo de cooldown antes de enviar otra.

```sql
-- Ver última alerta de autenticación
SELECT
  value->>'timestamp' as last_alert_time,
  value->>'error_count' as error_count,
  updated_at
FROM admin_settings
WHERE key = 'last_alert_authentication_failures';
```

Para resetear el cooldown (solo para pruebas):
```sql
DELETE FROM admin_settings WHERE key = 'last_alert_authentication_failures';
```

## Flujo de Depuración Paso a Paso

### Paso 1: Generar errores de login

1. Ir a `/login`
2. Intentar hacer login con credenciales incorrectas
3. Repetir 3-5 veces en menos de 1 minuto

### Paso 2: Verificar que se registraron

1. Ir a Dashboard Admin → Seguridad → Registro de Actividad
2. Hacer clic en **"Refrescar"**
3. Deberías ver logs con:
   - Acción: `LOGIN_FAILED`
   - Estado: ❌ Error
   - Usuario: el email que intentaste

### Paso 3: Ver detalles de un log

1. Hacer clic en **"Ver detalles"** en cualquier log de LOGIN_FAILED
2. Verificar campos:
   - **Estado**: Error
   - **Mensaje de Error**: Debería decir "Credenciales incorrectas"
   - **Detalles Adicionales**: Debería tener email, error_code, etc.

### Paso 4: Configurar alerta para pruebas

1. Ir a pestaña **Alertas**
2. Encontrar "Fallos de Autenticación"
3. Ajustar:
   - Umbral: **2**
   - Ventana: **1 minuto**
   - Cooldown: **1 minuto**
4. Asegurar que el toggle está **activado** (verde)
5. Guardar configuración

### Paso 5: Resetear cooldown (si es necesario)

Ejecutar en Supabase SQL Editor:
```sql
DELETE FROM admin_settings WHERE key = 'last_alert_authentication_failures';
```

### Paso 6: Generar más errores

1. Volver a `/login`
2. Intentar login incorrecto 2-3 veces más
3. Todo en menos de 1 minuto

### Paso 7: Probar alerta manualmente

1. Ir a Dashboard Admin → Seguridad → Alertas
2. En "Fallos de Autenticación", clic en **"Probar Alerta"**
3. Abrir consola del navegador (F12)
4. Ver resultado en consola

**Si triggered = true**: ¡Funciona! Revisar email.
**Si triggered = false**: Ver el mensaje y details para entender por qué.

## Errores Comunes y Soluciones

### Error: "No se alcanzó el umbral"

**Causa**: No hay suficientes errores en la ventana de tiempo.

**Solución**:
1. Verificar que los errores se registraron en audit_logs
2. Reducir el umbral a 1-2 para pruebas
3. Aumentar la ventana de tiempo a 10-15 minutos
4. Generar más errores de login

### Error: "Error al consultar logs: permission denied"

**Causa**: El usuario no tiene permisos para leer audit_logs.

**Solución**:
1. Verificar que eres admin (`is_admin = true` en profiles)
2. Verificar RLS policies en audit_logs
3. Ejecutar: `SELECT * FROM audit_logs LIMIT 1;` en SQL Editor

### Error: Template "admin_system_anomaly_alert" not found

**Causa**: La función send-email no tiene ese template.

**Solución temporal**:
Usar un template existente. En `alerts.service.ts`, cambiar:
```typescript
template_name: 'booking_confirmation_customer'
// o cualquier otro template que exista
```

**Solución permanente**:
Agregar el template a la función send-email.

### Error: "Failed to send alert email"

**Causa**: La función send-email falló.

**Solución**:
1. Ver logs de la función send-email en Supabase Dashboard
2. Verificar credenciales de email (SMTP, API key, etc.)
3. Verificar que la función está desplegada y activa

### No se registran los errores de login

**Causa 1**: El componente Login no está llamando a `logError()`.

**Solución 1**: Verificar que el código en `Login.tsx` incluye:
```typescript
import { logError, logAction } from '../services/audit.service';

// En el catch del login:
logError(
  'LOGIN_FAILED',
  'Credenciales incorrectas',
  {
    error_code: error.status || 'unknown'
  },
  email  // ✅ IMPORTANTE: Pasar el email como 4to parámetro
);
```

**Causa 2**: RLS Policy no permite logs anónimos (PROBLEMA MÁS COMÚN ✅)

Cuando intentas hacer login con credenciales incorrectas, NO estás autenticado todavía, por lo que la política RLS original no te permite insertar en `audit_logs`.

**Solución 2**: Verificar que existe la política para usuarios anónimos:

```sql
-- Ejecutar en Supabase SQL Editor
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'audit_logs'
AND policyname = 'Anonymous users can insert login failure logs';
```

Si NO existe, ejecutar:
```sql
CREATE POLICY "Anonymous users can insert login failure logs"
  ON audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    action IN ('LOGIN_FAILED', 'LOGIN_ERROR', 'LOGIN_ATTEMPT')
  );
```

Esta política permite que usuarios NO autenticados (anon) inserten logs, pero SOLO si el `action` es uno de los permitidos para login. Esto es seguro porque:
- Solo permite acciones específicas de login
- No permite ver logs (SELECT sigue requiriendo admin)
- No permite insertar otros tipos de logs

**Nota**: Este problema se resolvió en la migración `20260207042000_allow_anonymous_login_logs.sql` que ya fue aplicada automáticamente.

## Verificación Final

Una vez que todo funcione, verificar:

- [ ] Los errores de login se registran en audit_logs
- [ ] La configuración de alertas se guarda correctamente
- [ ] La prueba manual de alerta funciona
- [ ] Se recibe el email de alerta
- [ ] El cooldown previene spam de alertas
- [ ] El botón "Refrescar" actualiza los logs
- [ ] El modal "Ver detalles" muestra toda la información

## Comandos SQL Útiles

```sql
-- Limpiar todos los logs (cuidado!)
TRUNCATE audit_logs;

-- Ver estadísticas de errores
SELECT
  action,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE success = false) as errors
FROM audit_logs
GROUP BY action
ORDER BY errors DESC;

-- Ver errores recientes agrupados
SELECT
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as error_count
FROM audit_logs
WHERE success = false
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;

-- Resetear todas las alertas (eliminar cooldowns)
DELETE FROM admin_settings WHERE key LIKE 'last_alert_%';
```

## Soporte Adicional

Si después de seguir todos estos pasos aún no funciona:

1. Compartir el resultado de "Probar Alerta" desde la consola
2. Compartir los últimos 5 registros de audit_logs con LOGIN_FAILED
3. Compartir la configuración de la alerta (umbral, ventana, patrón)
4. Compartir logs de la función send-email (desde Supabase Dashboard)
