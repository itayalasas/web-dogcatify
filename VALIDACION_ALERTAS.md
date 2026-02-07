# Validación del Sistema de Alertas

## Problema Identificado

El sistema de alertas **NO está hardcodeado** y **SÍ funciona correctamente**. El mensaje "Se encontraron 0 errores" es correcto porque los errores de login que generaste son **demasiado antiguos** (de hace 47-49 minutos).

## Cómo Funciona el Sistema

### 1. Ventana de Tiempo (Time Window)
El sistema solo cuenta errores dentro de la **ventana de tiempo configurada**:
- Si configuras **1 minuto**: solo cuenta errores de los últimos 60 segundos
- Si configuras **5 minutos**: solo cuenta errores de los últimos 5 minutos
- Si configuras **15 minutos**: solo cuenta errores de los últimos 15 minutos

### 2. Patrón de Búsqueda
Para "Fallos de Autenticación", el sistema busca el patrón **"LOGIN"** en:
- `action` (columna de la tabla audit_logs)
- `error_message` (columna de la tabla audit_logs)
- `resource_type` (columna de la tabla audit_logs)

### 3. Condiciones para Activar la Alerta
TODAS estas condiciones deben cumplirse:
1. `success = false` (es un error)
2. El patrón "LOGIN" aparece en action, error_message o resource_type
3. El error ocurrió dentro de la ventana de tiempo
4. El número de errores alcanza o supera el umbral configurado

## Validación con Datos Reales

### Estado Actual de tus Errores

Tus fallos de login más recientes son de hace **47-49 minutos**:

```
LOGIN_FAILED | hace 47.56 minutos
LOGIN_FAILED | hace 48.35 minutos
LOGIN_FAILED | hace 48.38 minutos
LOGIN_FAILED | hace 48.72 minutos
LOGIN_FAILED | hace 49.84 minutos
LOGIN_FAILED | hace 49.87 minutos
LOGIN_FAILED | hace 49.90 minutos
```

### Tu Configuración
- **Umbral**: 2 errores
- **Ventana de tiempo**: 1 minuto

### Resultado
El sistema busca errores de los últimos **1 minuto**, pero tus errores son de hace **47-49 minutos**.

**Por eso encuentra 0 errores** - ¡Es correcto!

## Cómo Probar que Funciona Correctamente

### Opción 1: Generar Errores Nuevos (Recomendado)

1. **Abre la consola del navegador** (F12)
2. **Ve a la página de Login** (no cierres sesión, abre en una pestaña de incógnito)
3. **Intenta iniciar sesión con credenciales incorrectas** 2 veces seguidas
4. **Inmediatamente** ve a Dashboard Admin → Seguridad → Alertas
5. Haz click en **"Probar Alerta"** para "Fallos de Autenticación"

**Verás algo como:**
```
Se alcanzó el umbral. Se encontraron 2 errores (umbral: 2)
```

Y se enviará una alerta por email.

### Opción 2: Ajustar la Ventana de Tiempo

Si quieres usar los errores existentes para probar:

1. **Ve a Seguridad → Alertas → Fallos de Autenticación**
2. **Cambia "Ventana de tiempo"** de `1` a `60` minutos (o más)
3. **Guarda los cambios**
4. **Haz click en "Probar Alerta"**

**Verás algo como:**
```
Se alcanzó el umbral. Se encontraron 7 errores (umbral: 2)
```

## Debugging Mejorado

Agregué logging extenso al sistema. Ahora cuando pruebes una alerta, verás en la consola:

```
=== MANUAL ALERT CHECK ===
Alert Type: authentication_failures
Pattern: LOGIN
Threshold: 2
Time Window: 1 minutes
Looking since: 2026-02-07T05:37:44.000Z
Current time: 2026-02-07T05:38:44.000Z
Query Result: {
  count: 0,
  dataLength: 0,
  error: null,
  sample: []
}
=== END ALERT CHECK ===
```

Esto te permite ver:
- **Qué patrón** está buscando
- **Desde cuándo** está buscando errores
- **Cuántos errores** encontró
- **Qué errores** encontró (muestra los primeros 3)

## Verificación SQL Directa

Puedes verificar manualmente con estas queries en Supabase SQL Editor:

### Ver todos los fallos de login recientes
```sql
SELECT
  action,
  error_message,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM audit_logs
WHERE success = false
  AND action ILIKE '%LOGIN%'
ORDER BY created_at DESC
LIMIT 10;
```

### Simular la query del sistema (ventana de 1 minuto)
```sql
SELECT COUNT(*) as total
FROM audit_logs
WHERE success = false
  AND created_at >= NOW() - INTERVAL '1 minute'
  AND (
    error_message ILIKE '%LOGIN%'
    OR action ILIKE '%LOGIN%'
    OR resource_type ILIKE '%LOGIN%'
  );
```

### Simular con ventana de 60 minutos
```sql
SELECT COUNT(*) as total
FROM audit_logs
WHERE success = false
  AND created_at >= NOW() - INTERVAL '60 minutes'
  AND (
    error_message ILIKE '%LOGIN%'
    OR action ILIKE '%LOGIN%'
    OR resource_type ILIKE '%LOGIN%'
  );
```

## Prueba Completa Paso a Paso

### Test 1: Con Umbral de 2 Errores en 1 Minuto

1. Abre una ventana de incógnito
2. Ve a la página de login
3. Intenta iniciar sesión con credenciales incorrectas **2 veces en menos de 1 minuto**
4. Ve a Dashboard Admin → Seguridad → Alertas
5. Abre la consola del navegador (F12)
6. Haz click en "Probar Alerta" para "Fallos de Autenticación"
7. Revisa la consola - deberías ver el conteo de 2 errores

**Resultado esperado:** Alerta se dispara, se envía email

### Test 2: Con Solo 1 Error (No Alcanza Umbral)

1. Espera más de 1 minuto desde el último error
2. Intenta iniciar sesión con credenciales incorrectas **solo 1 vez**
3. Ve a Dashboard Admin → Seguridad → Alertas
4. Haz click en "Probar Alerta"

**Resultado esperado:** No se dispara alerta porque solo hay 1 error (umbral es 2)

### Test 3: Con Errores Fuera de Ventana de Tiempo

1. Genera 2 errores de login
2. **Espera más de 1 minuto**
3. Haz click en "Probar Alerta"

**Resultado esperado:** No se dispara alerta porque los errores están fuera de la ventana de tiempo

## Configuraciones Recomendadas

### Para Pruebas en Desarrollo
- **Umbral**: 2 errores
- **Ventana de tiempo**: 5 minutos
- **Cooldown**: 0 minutos (para poder probar múltiples veces)

Esto te da tiempo suficiente para generar errores sin que expiren.

### Para Producción
- **Umbral**: 5-10 errores
- **Ventana de tiempo**: 10-15 minutos
- **Cooldown**: 30-60 minutos (evita spam de alertas)

Esto evita alertas por fallos ocasionales pero detecta patrones sospechosos.

## Tipos de Alertas y sus Patrones

| Tipo de Alerta | Patrón | Busca en |
|----------------|--------|----------|
| Fallos de Autenticación | `LOGIN` | action, error_message, resource_type |
| Errores de Pago | `payment` | action, error_message, resource_type |
| Errores de Base de Datos | `database\|connection\|timeout` | action, error_message, resource_type |
| Errores de API 5xx | `5xx\|500\|502\|503` | action, error_message, resource_type |
| Actividad Sospechosa | (sin patrón) | todos los errores |

## Resumen

### El sistema NO está hardcodeado ✓
- La query SQL funciona correctamente
- El conteo de errores es dinámico y en tiempo real
- Los patrones de búsqueda funcionan

### Por qué viste 0 errores ✓
- Tus errores son de hace 47-49 minutos
- Tu ventana de tiempo es 1 minuto
- Por lo tanto, 0 errores en los últimos 1 minuto es **correcto**

### Cómo validar que funciona ✓
1. Genera errores nuevos (dentro de la ventana de tiempo)
2. O ajusta la ventana de tiempo para incluir los errores existentes
3. Observa el debugging en la consola
4. Verifica que la alerta se dispara cuando se alcanza el umbral

## Próximos Pasos

1. **Recarga la aplicación** (para obtener el nuevo debugging)
2. **Genera 2 fallos de login nuevos** (en menos de 1 minuto)
3. **Prueba la alerta** y observa la consola
4. **Comparte los logs de la consola** si aún no funciona

Los logs te mostrarán exactamente qué está buscando el sistema y qué encuentra.
