# Integración de Auditoría para App Móvil

Este documento explica cómo configurar la aplicación móvil (iOS/Android) para enviar logs de auditoría a la misma tabla `audit_logs` que usa la web.

## Tabla de Destino

La tabla `audit_logs` ya está configurada y lista para recibir logs desde cualquier cliente (web o móvil):

```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,                    -- ID del usuario (null si no autenticado)
  user_email text,                 -- Email del usuario
  action text NOT NULL,            -- Acción realizada (LOGIN, BOOKING_CREATE, etc.)
  resource_type text,              -- Tipo de recurso (booking, order, payment, etc.)
  resource_id text,                -- ID del recurso específico
  details jsonb DEFAULT '{}'::jsonb, -- Datos adicionales en JSON
  ip_address text,                 -- IP del cliente (opcional)
  user_agent text,                 -- User agent / device info
  success boolean DEFAULT true,    -- true = éxito, false = error
  error_message text,              -- Mensaje de error si success = false
  created_at timestamptz DEFAULT now()
);
```

## Políticas RLS (Ya Configuradas)

✅ **Para usuarios autenticados:**
```sql
-- Permite insertar cualquier tipo de log
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);
```

✅ **Para usuarios NO autenticados (importante para login fallido):**
```sql
-- Solo permite insertar logs de login/autenticación
CREATE POLICY "Anonymous users can insert login failure logs"
  ON audit_logs FOR INSERT TO anon
  WITH CHECK (
    action IN ('LOGIN_FAILED', 'LOGIN_ERROR', 'LOGIN_ATTEMPT')
  );
```

## Configuración de Supabase en la App

### 1. Instalar el SDK de Supabase

**React Native:**
```bash
npm install @supabase/supabase-js
# o
yarn add @supabase/supabase-js
```

**Flutter:**
```yaml
dependencies:
  supabase_flutter: ^2.0.0
```

**Swift (iOS nativo):**
```swift
// Package.swift o SPM
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
]
```

**Kotlin (Android nativo):**
```kotlin
// build.gradle
implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
```

### 2. Inicializar Supabase

Las credenciales son las mismas que usa la web (del archivo `.env`):

**React Native:**
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xyzcompany.supabase.co'; // Tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Tu anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Flutter:**
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

await Supabase.initialize(
  url: 'https://xyzcompany.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
);

final supabase = Supabase.instance.client;
```

## Servicio de Auditoría para la App

### React Native / TypeScript

Crear `services/audit.service.ts` en la app:

```typescript
import { supabase } from '../lib/supabase';
import DeviceInfo from 'react-native-device-info'; // npm install react-native-device-info

export interface AuditLogParams {
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  success?: boolean;
  errorMessage?: string;
  userEmailOverride?: string;
}

class AuditService {
  /**
   * Registra una acción en audit_logs
   */
  async log(params: AuditLogParams) {
    try {
      // Obtener usuario actual (si está autenticado)
      const { data: { user } } = await supabase.auth.getUser();

      // Obtener información del dispositivo
      const deviceInfo = await this.getDeviceInfo();

      const logEntry = {
        user_id: user?.id || null,
        user_email: params.userEmailOverride || user?.email || null,
        action: params.action,
        resource_type: params.resourceType || null,
        resource_id: params.resourceId || null,
        details: {
          ...(params.details || {}),
          platform: deviceInfo.platform,
          app_version: deviceInfo.appVersion,
          device_model: deviceInfo.deviceModel
        },
        ip_address: null, // El servidor puede detectar esto
        user_agent: deviceInfo.userAgent,
        success: params.success !== undefined ? params.success : true,
        error_message: params.errorMessage || null,
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Error creating audit log:', error);
      }
    } catch (error) {
      console.error('Error in audit service:', error);
      // NO fallar silenciosamente en dev
      if (__DEV__) {
        console.warn('Failed to log audit:', params);
      }
    }
  }

  /**
   * Obtener información del dispositivo
   */
  private async getDeviceInfo() {
    try {
      const [platform, appVersion, deviceModel, systemVersion] = await Promise.all([
        DeviceInfo.getPlatform(),
        DeviceInfo.getVersion(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion()
      ]);

      return {
        platform, // 'ios' o 'android'
        appVersion,
        deviceModel,
        userAgent: `DogCatify-Mobile/${appVersion} (${platform}; ${deviceModel}; ${systemVersion})`
      };
    } catch (error) {
      return {
        platform: 'unknown',
        appVersion: '0.0.0',
        deviceModel: 'unknown',
        userAgent: 'DogCatify-Mobile/unknown'
      };
    }
  }

  /**
   * Log de acción exitosa
   */
  logAction(action: string, details?: any) {
    this.log({ action, details, success: true });
  }

  /**
   * Log de error
   */
  logError(action: string, errorMessage: string, details?: any, userEmail?: string) {
    this.log({
      action,
      errorMessage,
      details,
      success: false,
      userEmailOverride: userEmail
    });
  }

  /**
   * Log de acción sobre un recurso
   */
  logResourceAction(
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any
  ) {
    this.log({ action, resourceType, resourceId, details });
  }
}

export const auditService = new AuditService();

// Exports convenientes
export const logAction = (action: string, details?: any) =>
  auditService.logAction(action, details);

export const logError = (action: string, errorMessage: string, details?: any, userEmail?: string) =>
  auditService.logError(action, errorMessage, details, userEmail);

export const logResourceAction = (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any
) => auditService.logResourceAction(action, resourceType, resourceId, details);
```

### Flutter / Dart

Crear `lib/services/audit_service.dart`:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:device_info_plus/device_info_plus.dart'; // pub add device_info_plus
import 'package:package_info_plus/package_info_plus.dart'; // pub add package_info_plus
import 'dart:io' show Platform;

class AuditService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Registra una acción en audit_logs
  Future<void> log({
    required String action,
    String? resourceType,
    String? resourceId,
    Map<String, dynamic>? details,
    bool success = true,
    String? errorMessage,
    String? userEmailOverride,
  }) async {
    try {
      // Obtener usuario actual
      final user = _supabase.auth.currentUser;

      // Obtener info del dispositivo
      final deviceInfo = await _getDeviceInfo();

      final logEntry = {
        'user_id': user?.id,
        'user_email': userEmailOverride ?? user?.email,
        'action': action,
        'resource_type': resourceType,
        'resource_id': resourceId,
        'details': {
          ...?details,
          'platform': deviceInfo['platform'],
          'app_version': deviceInfo['appVersion'],
          'device_model': deviceInfo['deviceModel'],
        },
        'ip_address': null,
        'user_agent': deviceInfo['userAgent'],
        'success': success,
        'error_message': errorMessage,
      };

      await _supabase.from('audit_logs').insert(logEntry);
    } catch (e) {
      print('Error creating audit log: $e');
    }
  }

  /// Obtener información del dispositivo
  Future<Map<String, String>> _getDeviceInfo() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      final packageInfo = await PackageInfo.fromPlatform();

      String platform = Platform.isIOS ? 'ios' : 'android';
      String deviceModel = '';
      String systemVersion = '';

      if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        deviceModel = iosInfo.utsname.machine;
        systemVersion = iosInfo.systemVersion;
      } else {
        final androidInfo = await deviceInfo.androidInfo;
        deviceModel = androidInfo.model;
        systemVersion = androidInfo.version.release;
      }

      return {
        'platform': platform,
        'appVersion': packageInfo.version,
        'deviceModel': deviceModel,
        'userAgent': 'DogCatify-Mobile/${packageInfo.version} ($platform; $deviceModel; $systemVersion)'
      };
    } catch (e) {
      return {
        'platform': 'unknown',
        'appVersion': '0.0.0',
        'deviceModel': 'unknown',
        'userAgent': 'DogCatify-Mobile/unknown'
      };
    }
  }

  /// Log de acción exitosa
  Future<void> logAction(String action, [Map<String, dynamic>? details]) {
    return log(action: action, details: details, success: true);
  }

  /// Log de error
  Future<void> logError(
    String action,
    String errorMessage, [
    Map<String, dynamic>? details,
    String? userEmail,
  ]) {
    return log(
      action: action,
      errorMessage: errorMessage,
      details: details,
      success: false,
      userEmailOverride: userEmail,
    );
  }

  /// Log de acción sobre un recurso
  Future<void> logResourceAction(
    String action,
    String resourceType, [
    String? resourceId,
    Map<String, dynamic>? details,
  ]) {
    return log(
      action: action,
      resourceType: resourceType,
      resourceId: resourceId,
      details: details,
    );
  }
}

// Singleton
final auditService = AuditService();
```

## Ejemplos de Uso en la App

### 1. Login Exitoso

**React Native:**
```typescript
import { logAction } from './services/audit.service';

async function handleLogin(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Ver siguiente ejemplo (Login Fallido)
      throw error;
    }

    // ✅ Registrar login exitoso
    await logAction('LOGIN', {
      method: 'email_password',
      email: email
    });

    navigation.navigate('Home');
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

**Flutter:**
```dart
import 'package:myapp/services/audit_service.dart';

Future<void> handleLogin(String email, String password) async {
  try {
    final response = await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );

    // ✅ Registrar login exitoso
    await auditService.logAction('LOGIN', {
      'method': 'email_password',
      'email': email,
    });

    Navigator.pushReplacementNamed(context, '/home');
  } catch (e) {
    print('Login failed: $e');
  }
}
```

### 2. Login Fallido

**React Native:**
```typescript
import { logError } from './services/audit.service';

async function handleLogin(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // ❌ Registrar login fallido
      await logError(
        'LOGIN_FAILED',
        'Credenciales incorrectas',
        {
          error_code: error.status || 'unknown',
          error_message: error.message
        },
        email // Email del usuario que intentó login
      );

      Alert.alert('Error', 'Credenciales incorrectas');
      return;
    }

    // Login exitoso...
  } catch (error: any) {
    await logError(
      'LOGIN_ERROR',
      error.message || 'Error desconocido',
      { error_type: 'exception' },
      email
    );
  }
}
```

**Flutter:**
```dart
Future<void> handleLogin(String email, String password) async {
  try {
    final response = await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  } on AuthException catch (e) {
    // ❌ Registrar login fallido
    await auditService.logError(
      'LOGIN_FAILED',
      'Credenciales incorrectas',
      {
        'error_code': e.statusCode ?? 'unknown',
        'error_message': e.message,
      },
      email, // Email del usuario
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Error'),
        content: Text('Credenciales incorrectas'),
      ),
    );
  } catch (e) {
    await auditService.logError(
      'LOGIN_ERROR',
      e.toString(),
      {'error_type': 'exception'},
      email,
    );
  }
}
```

### 3. Crear Reserva (Booking)

**React Native:**
```typescript
import { logResourceAction } from './services/audit.service';

async function createBooking(bookingData: any) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;

    // ✅ Registrar creación de booking
    await logResourceAction(
      'BOOKING_CREATE',
      'booking',
      data.id,
      {
        service_id: bookingData.service_id,
        date: bookingData.date,
        status: data.status
      }
    );

    return data;
  } catch (error: any) {
    // ❌ Registrar error
    await logError(
      'BOOKING_CREATE_FAILED',
      error.message,
      { booking_data: bookingData }
    );
    throw error;
  }
}
```

### 4. Actualizar Perfil

**React Native:**
```typescript
async function updateProfile(updates: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await logResourceAction(
      'PROFILE_UPDATE',
      'profile',
      userId,
      { fields_updated: Object.keys(updates) }
    );
  } catch (error: any) {
    await logError('PROFILE_UPDATE_FAILED', error.message);
    throw error;
  }
}
```

### 5. Ver Datos Sensibles

**React Native:**
```typescript
async function viewPaymentDetails(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, payment_details')
      .eq('id', orderId)
      .single();

    if (error) throw error;

    // ✅ Registrar acceso a datos sensibles
    await logResourceAction(
      'PAYMENT_DETAILS_VIEW',
      'order',
      orderId,
      { action: 'view_sensitive_data' }
    );

    return data;
  } catch (error: any) {
    await logError('PAYMENT_DETAILS_VIEW_FAILED', error.message);
    throw error;
  }
}
```

## Acciones Recomendadas para Registrar

### Autenticación
- `LOGIN` - Login exitoso
- `LOGIN_FAILED` - Login fallido
- `LOGIN_ERROR` - Error de sistema en login
- `LOGOUT` - Cierre de sesión
- `PASSWORD_RESET` - Solicitud de reset de contraseña
- `PASSWORD_CHANGED` - Cambio exitoso de contraseña

### Recursos
- `[RESOURCE]_CREATE` - Crear recurso (BOOKING_CREATE, PET_CREATE, etc.)
- `[RESOURCE]_UPDATE` - Actualizar recurso
- `[RESOURCE]_DELETE` - Eliminar recurso
- `[RESOURCE]_VIEW` - Ver recurso (especialmente datos sensibles)

### Pagos
- `PAYMENT_INITIATED` - Inicio de pago
- `PAYMENT_SUCCESS` - Pago exitoso
- `PAYMENT_FAILED` - Pago fallido
- `REFUND_REQUESTED` - Solicitud de reembolso

### Acciones Críticas
- `ADMIN_ACCESS` - Acceso a panel admin
- `SENSITIVE_DATA_VIEW` - Visualización de datos sensibles
- `EXPORT_DATA` - Exportación de datos
- `SETTINGS_CHANGE` - Cambio en configuración

## Verificar Logs desde la App

Una vez implementado, verifica que funciona:

### 1. En el Dashboard Web

1. Ir a **Dashboard Admin → Seguridad → Registro de Actividad**
2. Hacer clic en **"Refrescar"**
3. Buscar logs con `user_agent` que contenga "DogCatify-Mobile"

### 2. Consulta SQL

```sql
-- Ver logs de la app móvil (últimos 50)
SELECT
  created_at,
  user_email,
  action,
  success,
  error_message,
  details->>'platform' as platform,
  details->>'app_version' as app_version,
  details->>'device_model' as device_model
FROM audit_logs
WHERE user_agent LIKE '%DogCatify-Mobile%'
ORDER BY created_at DESC
LIMIT 50;
```

### 3. Por plataforma

```sql
-- Solo iOS
SELECT * FROM audit_logs
WHERE details->>'platform' = 'ios'
ORDER BY created_at DESC
LIMIT 20;

-- Solo Android
SELECT * FROM audit_logs
WHERE details->>'platform' = 'android'
ORDER BY created_at DESC
LIMIT 20;
```

## Mejores Prácticas

### ✅ SÍ hacer:

1. **Registrar login fallidos** - Crucial para alertas de seguridad
2. **Incluir contexto del dispositivo** - Platform, app version, device model
3. **Registrar acciones críticas** - Pagos, acceso a datos sensibles
4. **Usar el email override** - Para logs sin autenticación (login fallido)
5. **Fallar silenciosamente en producción** - No detener la app si falla el log

### ❌ NO hacer:

1. **No registrar contraseñas** - NUNCA incluir passwords en details
2. **No registrar tokens** - No incluir API keys, tokens, secrets
3. **No bloquear la UI** - Logs deben ser async y no-blocking
4. **No registrar TODO** - Solo acciones importantes
5. **No incluir PII innecesario** - Minimizar datos personales en details

## Ejemplo de Implementación Completa

```typescript
// App.tsx
import { auditService } from './services/audit.service';

function App() {
  useEffect(() => {
    // Registrar inicio de app
    auditService.logAction('APP_STARTED', {
      timestamp: new Date().toISOString()
    });

    // Registrar cierre de app
    return () => {
      auditService.logAction('APP_CLOSED', {
        session_duration: getSessionDuration()
      });
    };
  }, []);

  return (
    <NavigationContainer>
      {/* Tu app */}
    </NavigationContainer>
  );
}
```

## Troubleshooting

### Problema: Los logs no aparecen en la base de datos

**Verificar:**
1. ¿El SUPABASE_URL y SUPABASE_ANON_KEY son correctos?
2. ¿La tabla `audit_logs` existe?
3. ¿Las políticas RLS están configuradas?
4. ¿Hay errores en la consola de la app?

**Probar:**
```typescript
// Test simple
auditService.log({
  action: 'TEST_FROM_APP',
  details: { test: true },
  success: true
}).then(() => {
  console.log('Log enviado correctamente');
}).catch(error => {
  console.error('Error enviando log:', error);
});
```

### Problema: Permission denied al insertar

**Causa**: Las políticas RLS no permiten la inserción.

**Solución**: Verificar que las políticas existen:
```sql
SELECT * FROM pg_policies WHERE tablename = 'audit_logs';
```

Debe haber al menos estas 2 políticas:
- `Authenticated users can insert audit logs`
- `Anonymous users can insert login failure logs`

### Problema: Logs de login fallidos no se guardan

**Causa**: Falta la política para usuarios anónimos.

**Solución**: Ejecutar en Supabase SQL Editor:
```sql
CREATE POLICY "Anonymous users can insert login failure logs"
  ON audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (
    action IN ('LOGIN_FAILED', 'LOGIN_ERROR', 'LOGIN_ATTEMPT')
  );
```

## Soporte

Para más información, ver:
- `SISTEMA_AUDITORIA.md` - Documentación del sistema de auditoría
- `TROUBLESHOOTING_ALERTAS.md` - Guía de resolución de problemas
- `SETUP_SEGURIDAD.md` - Configuración de seguridad

Para problemas específicos de la app móvil, contactar al equipo de desarrollo.
