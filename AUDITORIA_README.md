# Sistema de Auditoría y Seguridad - Índice de Documentación

## Navegación Rápida

### 🚀 Para Empezar

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **`SETUP_SEGURIDAD.md`** | Guía de configuración inicial del sistema de seguridad | Administradores / DevOps |
| **`CREATE_AUDIT_LOGS_TABLE.sql`** | Script SQL para crear la tabla audit_logs | Administradores / DevOps |

### 📚 Documentación del Sistema

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **`SISTEMA_AUDITORIA.md`** | Documentación completa del sistema de auditoría | Desarrolladores / Administradores |
| **`SISTEMA_ALERTAS.md`** | Sistema de alertas automáticas de seguridad | Administradores / DevOps |

### 📱 Integración Móvil

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **`APP_MOBILE_CHECKLIST.md`** | ⭐ **Checklist rápido** (5 pasos) para implementar en la app | Desarrolladores móvil |
| **`INTEGRACION_APP_MOBILE.md`** | Documentación completa con código de ejemplo (React Native, Flutter, Swift, Kotlin) | Desarrolladores móvil |

### 🔧 Troubleshooting

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **`TROUBLESHOOTING_ALERTAS.md`** | Guía paso a paso para resolver problemas con alertas | Administradores / DevOps |

## Flujo de Implementación

### Para Web (✅ Ya implementado)

1. ✅ Tabla `audit_logs` creada
2. ✅ RLS policies configuradas
3. ✅ Servicio de auditoría implementado
4. ✅ Login tracking implementado
5. ✅ Panel de seguridad en Dashboard Admin
6. ✅ Sistema de alertas configurado

### Para App Móvil (⏳ Pendiente)

1. [ ] Leer **`APP_MOBILE_CHECKLIST.md`**
2. [ ] Instalar SDK de Supabase en la app
3. [ ] Copiar servicio de auditoría (código en `INTEGRACION_APP_MOBILE.md`)
4. [ ] Implementar tracking de login
5. [ ] Implementar tracking de pagos
6. [ ] Implementar tracking de bookings
7. [ ] Verificar logs en Dashboard Admin

## Preguntas Frecuentes

### ¿Cómo funciona el sistema?

**Web:**
- Los componentes React llaman a `logAction()`, `logError()`, `logResourceAction()`
- Estos insertan registros en la tabla `audit_logs` de Supabase
- El panel Admin permite ver y buscar todos los logs

**App Móvil:**
- La app usa el mismo SDK de Supabase
- Llama a las mismas funciones de auditoría
- Los logs se guardan en la misma tabla `audit_logs`
- Se pueden filtrar por platform (ios/android)

### ¿Los logs de la app y web se mezclan?

Sí, están en la misma tabla. Puedes diferenciarlos por:
- **Web:** `user_agent` no contiene "DogCatify-Mobile"
- **App:** `user_agent` contiene "DogCatify-Mobile"
- **iOS:** `details->>'platform' = 'ios'`
- **Android:** `details->>'platform' = 'android'`

### ¿Qué acciones se registran?

**Autenticación:**
- LOGIN, LOGIN_FAILED, LOGOUT
- PASSWORD_RESET, PASSWORD_CHANGED

**Recursos:**
- BOOKING_CREATE, BOOKING_UPDATE, BOOKING_CANCEL
- ORDER_CREATE, ORDER_UPDATE
- PAYMENT_INITIATED, PAYMENT_SUCCESS, PAYMENT_FAILED
- PROFILE_UPDATE, PET_CREATE, etc.

**Administración:**
- ADMIN_ACCESS, SETTINGS_CHANGE
- SENSITIVE_DATA_VIEW, EXPORT_DATA

Ver lista completa en `SISTEMA_AUDITORIA.md`

### ¿Cómo funcionan las alertas?

El sistema revisa periódicamente la tabla `audit_logs` buscando patrones:
- **Fallos de autenticación:** X errores en Y minutos
- **Pagos fallidos:** X fallos en Y minutos
- **Errores del sistema:** X errores en Y minutos

Cuando se detecta un patrón, envía un email al administrador.

Ver configuración completa en `SISTEMA_ALERTAS.md`

### ¿Los logs de login fallidos se registran sin estar autenticado?

Sí. Hay una política RLS especial que permite a usuarios **anónimos** (no autenticados) insertar logs de tipo:
- LOGIN_FAILED
- LOGIN_ERROR
- LOGIN_ATTEMPT

Esto es seguro porque:
- Solo pueden insertar estos tipos de logs
- No pueden ver otros logs
- No pueden insertar logs de otros tipos

Ver más en `TROUBLESHOOTING_ALERTAS.md` → "No se registran los errores de login"

### ¿Cuánto espacio ocupan los logs?

Cada log ocupa aproximadamente 1-2 KB. Con el plan gratuito de Supabase (500 MB):
- Puedes almacenar 250,000 - 500,000 logs
- Se recomienda eliminar logs con más de 90 días

Ver mantenimiento en `SISTEMA_AUDITORIA.md`

### ¿Puedo ver los logs desde la app móvil?

No. Los logs solo pueden verse desde:
1. **Dashboard Admin Web** (panel de Seguridad)
2. **Supabase SQL Editor**
3. Queries custom desde el backend

Los usuarios normales NO pueden ver logs. Las políticas RLS solo permiten a administradores ver los logs.

### ¿Qué NO debo registrar en los logs?

❌ **NUNCA registrar:**
- Contraseñas
- Tokens de autenticación
- API keys
- Números de tarjeta completos
- CVV / códigos de seguridad
- PINs

✅ **SÍ puedes registrar:**
- Email del usuario
- IDs de recursos
- Estados (pending, completed, failed)
- Códigos de error
- Timestamps
- Info del dispositivo

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Aplicaciones                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Web App    │  │  iOS App     │  │ Android App  │  │
│  │  (React)     │  │ (Swift/RN)   │  │(Kotlin/RN)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │           │
│         └──────────────────┼──────────────────┘           │
│                            │                              │
│                    ┌───────▼────────┐                     │
│                    │  Supabase SDK  │                     │
│                    └───────┬────────┘                     │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Supabase DB    │
                    │  ┌────────────┐  │
                    │  │audit_logs  │◄─┼──── RLS Policies
                    │  │  table     │  │
                    │  └────────────┘  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Edge Function   │
                    │ check-alert-     │
                    │  thresholds      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Email Alerts    │
                    │  (send-email)    │
                    └──────────────────┘
```

## Soporte y Contacto

**Para problemas con el sistema web:**
- Ver `TROUBLESHOOTING_ALERTAS.md`
- Contactar al equipo backend

**Para implementación en app móvil:**
- Ver `APP_MOBILE_CHECKLIST.md`
- Ver `INTEGRACION_APP_MOBILE.md`
- Contactar al equipo móvil

**Para configuración de alertas:**
- Ver `SISTEMA_ALERTAS.md`
- Dashboard Admin → Seguridad → Alertas

---

**Última actualización:** 2026-02-07
**Versión del sistema:** 1.0
**Estado web:** ✅ Implementado
**Estado móvil:** ⏳ Pendiente de implementación
