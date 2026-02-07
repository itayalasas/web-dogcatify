# Checklist: Integrar Auditoría en la App Móvil

## Resumen Ejecutivo

La tabla `audit_logs` ya está lista y configurada. Solo necesitas agregar el código en la app para enviar logs.

**Tabla:** `audit_logs` (Supabase)
**Políticas RLS:** ✅ Configuradas (permite authenticated y anon)
**Documentación completa:** Ver `INTEGRACION_APP_MOBILE.md`

## Setup Rápido (5 pasos)

### 1️⃣ Instalar Supabase SDK

**React Native:**
```bash
npm install @supabase/supabase-js react-native-device-info
```

**Flutter:**
```yaml
dependencies:
  supabase_flutter: ^2.0.0
  device_info_plus: ^9.0.0
  package_info_plus: ^4.0.0
```

### 2️⃣ Configurar Supabase Client

Usar las mismas credenciales que la web:

```typescript
// React Native: lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'TU_SUPABASE_URL',
  'TU_SUPABASE_ANON_KEY'
);
```

```dart
// Flutter: lib/main.dart
await Supabase.initialize(
  url: 'TU_SUPABASE_URL',
  anonKey: 'TU_SUPABASE_ANON_KEY',
);
```

### 3️⃣ Copiar Servicio de Auditoría

Ver código completo en `INTEGRACION_APP_MOBILE.md`

**Archivos a crear:**
- React Native: `services/audit.service.ts`
- Flutter: `lib/services/audit_service.dart`

### 4️⃣ Implementar en Login

**React Native:**
```typescript
import { logAction, logError } from './services/audit.service';

// Login exitoso
await logAction('LOGIN', { method: 'email_password', email });

// Login fallido
await logError('LOGIN_FAILED', 'Credenciales incorrectas', {
  error_code: error.status
}, email);
```

**Flutter:**
```dart
import 'package:myapp/services/audit_service.dart';

// Login exitoso
await auditService.logAction('LOGIN', {'method': 'email_password', 'email': email});

// Login fallido
await auditService.logError('LOGIN_FAILED', 'Credenciales incorrectas', {
  'error_code': e.statusCode
}, email);
```

### 5️⃣ Verificar que Funciona

1. Intentar login fallido 2-3 veces desde la app
2. Ir al Dashboard Web → Admin → Seguridad → Registro de Actividad
3. Buscar logs con `user_agent` que diga "DogCatify-Mobile"
4. Verificar que aparecen con platform, app_version, device_model

## Acciones Críticas a Registrar

### 🔴 Alta Prioridad (implementar primero)

- [ ] `LOGIN` - Login exitoso
- [ ] `LOGIN_FAILED` - Login fallido (para alertas de seguridad)
- [ ] `PAYMENT_INITIATED` - Inicio de pago
- [ ] `PAYMENT_SUCCESS` - Pago completado
- [ ] `PAYMENT_FAILED` - Pago fallido

### 🟡 Media Prioridad

- [ ] `BOOKING_CREATE` - Crear reserva
- [ ] `BOOKING_CANCEL` - Cancelar reserva
- [ ] `PROFILE_UPDATE` - Actualizar perfil
- [ ] `PASSWORD_CHANGED` - Cambio de contraseña
- [ ] `LOGOUT` - Cierre de sesión

### 🟢 Baja Prioridad

- [ ] `APP_STARTED` - Inicio de app
- [ ] `PET_CREATE` - Agregar mascota
- [ ] `MEDICAL_RECORD_VIEW` - Ver historial médico
- [ ] `SETTINGS_CHANGE` - Cambio configuración

## Formato del Log

```javascript
{
  action: "LOGIN_FAILED",           // Acción (requerido)
  user_email: "user@example.com",   // Email del usuario
  success: false,                   // true/false
  error_message: "Credenciales...", // Si success=false
  resource_type: "booking",         // Tipo de recurso (opcional)
  resource_id: "uuid-123",          // ID del recurso (opcional)
  details: {                        // JSON con info adicional
    platform: "ios",                // Agregado automáticamente
    app_version: "1.2.3",           // Agregado automáticamente
    device_model: "iPhone 14",      // Agregado automáticamente
    error_code: "401",              // Tu data custom
    // ... más campos que necesites
  }
}
```

## Seguridad: NO Registrar

❌ **NUNCA incluir en logs:**
- Contraseñas
- Tokens de autenticación
- API keys
- Números de tarjeta completos
- Códigos de seguridad (CVV)
- PINs

✅ **SÍ puedes incluir:**
- Email del usuario
- IDs de recursos (bookings, orders, etc.)
- Estados (pending, completed, failed)
- Códigos de error
- Timestamps
- Info del dispositivo

## Testing

### Test 1: Login Fallido

```bash
# 1. Desde la app, intentar login con password incorrecta
# 2. En Supabase SQL Editor:

SELECT
  created_at,
  user_email,
  action,
  success,
  error_message,
  details->>'platform' as platform
FROM audit_logs
WHERE action = 'LOGIN_FAILED'
ORDER BY created_at DESC
LIMIT 5;
```

**Esperado:** Ver tu intento de login con todos los detalles.

### Test 2: Booking Create

```bash
# 1. Desde la app, crear una reserva
# 2. En Supabase SQL Editor:

SELECT
  created_at,
  action,
  resource_id,
  details->>'service_id' as service_id,
  details->>'platform' as platform
FROM audit_logs
WHERE action = 'BOOKING_CREATE'
ORDER BY created_at DESC
LIMIT 5;
```

**Esperado:** Ver la creación con el ID del booking y platform.

## FAQs

### ¿Afecta el performance?

No. Los logs son async y no bloquean la UI. Si falla, falla silenciosamente sin afectar la app.

### ¿Qué pasa si no hay internet?

El insert fallará silenciosamente. Puedes implementar retry logic o queue si es crítico.

### ¿Cuánto cuesta?

Supabase tiene 500MB gratis de base de datos. Los logs son pequeños (~1-2KB cada uno). Con 500MB puedes guardar fácilmente 250,000-500,000 logs.

### ¿Los logs de la app y web se mezclan?

Sí, están en la misma tabla. Puedes filtrar por `user_agent` o `details->>'platform'` para separar:
- Web: user_agent NO contiene "DogCatify-Mobile"
- iOS: `details->>'platform' = 'ios'`
- Android: `details->>'platform' = 'android'`

### ¿Necesito permisos especiales?

No. Las políticas RLS ya están configuradas:
- Usuarios autenticados: pueden insertar cualquier log
- Usuarios anónimos: solo pueden insertar logs de LOGIN_FAILED/LOGIN_ERROR

### ¿Puedo ver los logs desde la app?

No directamente. Los logs solo pueden verse desde:
1. Dashboard Admin Web (panel de Seguridad)
2. Supabase SQL Editor
3. Queries custom desde backend

Los usuarios normales NO pueden ver logs (RLS lo previene).

## Próximos Pasos

1. [ ] Leer `INTEGRACION_APP_MOBILE.md` completo
2. [ ] Implementar servicio de auditoría en la app
3. [ ] Agregar logs en Login (success y failed)
4. [ ] Probar con login incorrecto 3 veces
5. [ ] Verificar en Dashboard Web que aparecen los logs
6. [ ] Implementar logs en Payments
7. [ ] Implementar logs en Bookings
8. [ ] (Opcional) Agregar logs en otras acciones críticas

## Contacto

Para preguntas o problemas:
- Ver documentación completa: `INTEGRACION_APP_MOBILE.md`
- Troubleshooting: `TROUBLESHOOTING_ALERTAS.md`
- Sistema general: `SISTEMA_AUDITORIA.md`

---

**Tiempo estimado de implementación:** 2-4 horas para básico (login + payments)
**Prioridad:** 🔴 Alta (especialmente login fallidos para alertas de seguridad)
