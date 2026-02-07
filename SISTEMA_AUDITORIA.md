# Sistema de Auditoría DogCatify

## Descripción General

Se ha implementado un sistema completo de auditoría para registrar todas las transacciones y acciones importantes en la aplicación DogCatify (web y móvil). Este sistema permite:

- Registrar todas las acciones de usuarios (LOGIN, CREATE, UPDATE, DELETE, etc.)
- Rastrear cambios en recursos (bookings, orders, products, partners, etc.)
- Monitorear actividad sospechosa
- Cumplir con requisitos de auditoría y compliance
- **Registrar logs desde la app móvil** (iOS y Android) en la misma tabla

## Configuración Inicial

### Paso 1: Crear la Tabla de Auditoría

La tabla `audit_logs` aún no existe en la base de datos. Para crearla:

1. Ir al Dashboard de Supabase
2. Navegar a **SQL Editor**
3. Abrir el archivo `CREATE_AUDIT_LOGS_TABLE.sql` en la raíz del proyecto
4. Copiar todo el contenido del archivo
5. Pegarlo en el SQL Editor de Supabase
6. Hacer clic en **Run** para ejecutar el script

### Estructura de la Tabla

```sql
audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
)
```

## Uso del Servicio de Auditoría

### Importar el Servicio

```typescript
import { auditService, logAction, logResourceAction, logError } from '../services/audit.service';
```

### Ejemplos de Uso

#### 1. Registrar una acción simple

```typescript
// Cuando un usuario inicia sesión
logAction('LOGIN');

// Con detalles adicionales
logAction('LOGIN', { device: 'mobile', browser: 'Chrome' });
```

#### 2. Registrar acciones sobre recursos

```typescript
// Cuando se crea una reserva
logResourceAction('CREATE', 'booking', bookingId, {
  service_name: 'Peluquería',
  customer: 'Juan Pérez',
  date: '2026-02-10'
});

// Cuando se actualiza un pedido
logResourceAction('UPDATE', 'order', orderId, {
  status: 'confirmed',
  previous_status: 'pending'
});

// Cuando se elimina un producto
logResourceAction('DELETE', 'product', productId, {
  product_name: 'Collar para perro'
});
```

#### 3. Registrar errores

```typescript
try {
  // operación que puede fallar
} catch (error) {
  logError('CREATE_BOOKING', error.message, {
    attempted_data: bookingData
  });
}
```

### Integración en Componentes

Ejemplo de cómo integrar el logging en un componente:

```typescript
import { logResourceAction } from '../services/audit.service';

const handleCreateBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;

    // Registrar la acción exitosa
    logResourceAction('CREATE', 'booking', data.id, {
      service: bookingData.service_name,
      date: bookingData.date
    });

    showNotification('success', 'Reserva creada');
  } catch (error) {
    // Registrar el error
    logError('CREATE_BOOKING', error.message, bookingData);
    showNotification('error', 'Error al crear reserva');
  }
};
```

## Panel de Seguridad

El panel de seguridad en el dashboard de administrador incluye:

### Pestaña "Registro de Actividad"

- Muestra todos los logs de auditoría en tiempo real
- Búsqueda por email, acción o tipo de recurso
- Información detallada: usuario, acción, recurso, IP, estado
- Indicador visual de éxito/error
- Tooltip con mensaje de error en logs fallidos

### Pestaña "Configuración"

#### Opciones Disponibles:

1. **Autenticación de dos factores** (Próximamente)
   - Actualmente marcada como "no implementada"
   - El toggle está deshabilitado
   - Lista para implementación futura

2. **Registro de actividad detallado** ✓ Funcional
   - Activa/desactiva el registro detallado de auditoría
   - Se guarda en admin_settings

3. **Notificaciones de seguridad** ✓ Funcional
   - Habilita alertas por email ante actividad sospechosa
   - Se guarda en admin_settings

4. **Tiempo de sesión** ✓ Funcional
   - Configura la duración máxima de sesión (30 min - 24 horas)
   - Se guarda en admin_settings

Todas las configuraciones se guardan en la tabla `admin_settings` y persisten entre sesiones.

## Tipos de Acciones Recomendadas

Para mantener consistencia, se recomienda usar estos tipos de acciones:

- `LOGIN` - Inicio de sesión
- `LOGOUT` - Cierre de sesión
- `CREATE` - Creación de recursos
- `UPDATE` - Actualización de recursos
- `DELETE` - Eliminación de recursos
- `VIEW` - Visualización de recursos sensibles
- `EXPORT` - Exportación de datos
- `IMPORT` - Importación de datos
- `PAYMENT` - Transacciones de pago
- `APPROVE` - Aprobación de solicitudes
- `REJECT` - Rechazo de solicitudes

## Tipos de Recursos

- `booking` - Reservas/Citas
- `order` - Pedidos
- `product` - Productos
- `partner` - Aliados/Partners
- `user` - Usuarios
- `pet` - Mascotas
- `payment` - Pagos
- `promotion` - Promociones
- `place` - Lugares Pet-Friendly

## Consultas Avanzadas

El servicio incluye métodos para consultas específicas:

```typescript
// Obtener logs de un usuario específico
const userLogs = await auditService.getLogsByUser(userId, 50);

// Obtener logs de una acción específica
const loginLogs = await auditService.getLogsByAction('LOGIN', 100);

// Obtener logs de un tipo de recurso
const bookingLogs = await auditService.getLogsByResourceType('booking', 50);

// Búsqueda general
const searchResults = await auditService.searchLogs('juan@example.com');
```

## Seguridad

- Solo administradores (is_admin = true) pueden ver los logs de auditoría
- Todos los usuarios autenticados pueden crear logs
- Los logs incluyen automáticamente el user_id y email del usuario actual
- RLS (Row Level Security) está habilitado en la tabla

## Sistema de Alertas Integrado

✅ **IMPLEMENTADO**: Sistema completo de alertas automáticas basado en audit_logs

El sistema de auditoría está integrado con un sistema de alertas que:
- Monitorea automáticamente los logs de error
- Envía emails cuando se superan umbrales configurables
- Detecta 5 tipos de anomalías: errores de pago, base de datos, autenticación, API 5xx y actividad sospechosa
- Panel de configuración en Dashboard Admin → Seguridad → Alertas

**Ver documentación completa**: `SISTEMA_ALERTAS.md`

## Próximos Pasos

1. ✅ ~~Crear la tabla `audit_logs` usando el script SQL proporcionado~~
2. Integrar `logAction` y `logResourceAction` en los componentes principales
3. Considerar implementación de 2FA (autenticación de dos factores)
4. ✅ ~~Configurar alertas automáticas para actividad sospechosa~~ → Ver SISTEMA_ALERTAS.md
5. Implementar retención de logs (eliminar logs antiguos después de X días)
6. Configurar cron job para ejecutar check-alert-thresholds cada 5 minutos

## Mantenimiento

### Limpieza de Logs Antiguos

Se recomienda implementar una función que elimine logs antiguos periódicamente:

```sql
-- Eliminar logs con más de 90 días
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

Esto se puede ejecutar como un cron job o una función edge de Supabase.

### Monitoreo

Crear alertas para:
- Múltiples intentos de login fallidos
- Acciones DELETE masivas
- Accesos desde IPs sospechosas
- Cambios en configuración crítica

## Integración con App Móvil

El sistema de auditoría está completamente preparado para recibir logs desde la aplicación móvil (iOS/Android).

### Configuración Rápida

**Para el equipo móvil, ver:**
- 📱 **`APP_MOBILE_CHECKLIST.md`** - Checklist rápido de implementación (5 pasos)
- 📚 **`INTEGRACION_APP_MOBILE.md`** - Documentación completa con código de ejemplo

### Características Principales

✅ **Misma tabla para web y móvil** - Los logs de ambas plataformas se guardan en `audit_logs`

✅ **RLS ya configurado** - Las políticas permiten insertar logs desde la app:
- Usuarios autenticados: pueden insertar cualquier log
- Usuarios anónimos: pueden insertar logs de login fallido

✅ **Información de dispositivo** - Los logs de la app incluyen automáticamente:
- Platform (ios/android)
- App version
- Device model
- User agent custom

✅ **Código de ejemplo incluido** - Para React Native y Flutter

### Ver Logs de la App

**Dashboard Web:**
1. Ir a Admin → Seguridad → Registro de Actividad
2. Los logs de la app tienen `user_agent` con "DogCatify-Mobile"
3. El campo `details` incluye `platform`, `app_version`, `device_model`

**SQL Query:**
```sql
-- Últimos 50 logs de la app móvil
SELECT
  created_at,
  user_email,
  action,
  details->>'platform' as platform,
  details->>'app_version' as version
FROM audit_logs
WHERE user_agent LIKE '%DogCatify-Mobile%'
ORDER BY created_at DESC
LIMIT 50;
```

### Prioridades de Implementación en App

**🔴 Alta Prioridad (para alertas de seguridad):**
- LOGIN_FAILED - Login fallido
- LOGIN - Login exitoso
- PAYMENT_FAILED - Pago fallido

**🟡 Media Prioridad:**
- BOOKING_CREATE - Crear reserva
- BOOKING_CANCEL - Cancelar reserva
- PAYMENT_SUCCESS - Pago exitoso

## Soporte

Para más información o dudas, consultar:

**Documentación del Sistema:**
- `SISTEMA_AUDITORIA.md` - Este archivo (documentación general)
- `SISTEMA_ALERTAS.md` - Sistema de alertas de seguridad
- `SETUP_SEGURIDAD.md` - Configuración de seguridad
- `TROUBLESHOOTING_ALERTAS.md` - Guía de resolución de problemas

**Integración Móvil:**
- `APP_MOBILE_CHECKLIST.md` - Checklist rápido (5 pasos)
- `INTEGRACION_APP_MOBILE.md` - Documentación completa

**Código Fuente:**
- Servicio Web: `src/services/audit.service.ts`
- Panel Admin: `src/components/admin/SecurityManager.tsx`
- Tabla SQL: `CREATE_AUDIT_LOGS_TABLE.sql`

**Supabase:**
- Documentación: https://supabase.com/docs
