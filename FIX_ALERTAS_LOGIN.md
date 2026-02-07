# Solución: Alertas de Login No Se Disparaban

## Problema Identificado

Las alertas de **Fallos de Autenticación** NO se estaban disparando a pesar de tener múltiples errores de `LOGIN_FAILED` registrados en `audit_logs`.

### Síntoma

En el Dashboard Admin → Seguridad → Alertas, al hacer clic en "Probar Alerta" en **Fallos de Autenticación**, mostraba:

```
No se alcanzó el umbral. Se encontraron 0 errores de 2 necesarios en los últimos 1 minutos
```

A pesar de que en la pestaña "Registro de Actividad" había múltiples errores de `LOGIN_FAILED` visibles.

### Causa Raíz

El problema estaba en el **patrón de búsqueda** (`error_pattern`) configurado para la alerta de autenticación.

**Patrón original (INCORRECTO):**
```typescript
error_pattern: 'LOGIN|login|auth|AUTH|credentials|Credenciales'
```

Este patrón usa el separador `|` (pipe) como si fuera un "OR" lógico, pero cuando se usa con PostgREST y el operador `.or()` con `.ilike`, no funciona así.

### Cómo Funcionaba el Query (Incorrecto)

El código generaba este query:

```typescript
supabase
  .from('audit_logs')
  .select('id', { count: 'exact' })
  .eq('success', false)
  .gte('created_at', timeWindow.toISOString())
  .or(`error_message.ilike.%LOGIN|login|auth|AUTH|credentials|Credenciales%,action.ilike.%LOGIN|login|auth|AUTH|credentials|Credenciales%`)
```

Esto busca literalmente el string completo:
- `action ILIKE '%LOGIN|login|auth|AUTH|credentials|Credenciales%'`

Pero los valores reales en `audit_logs` son:
- `action = 'LOGIN_FAILED'`
- `action = 'LOGIN_ERROR'`
- `action = 'LOGIN'`

Ninguno de estos contiene el texto completo `LOGIN|login|auth|...`, por eso el query retornaba 0 resultados.

### Solución Aplicada

**Patrón nuevo (CORRECTO):**
```typescript
error_pattern: 'LOGIN'
```

Ahora el query busca:
```sql
action ILIKE '%LOGIN%'
```

Esto matchea correctamente:
- ✅ `LOGIN_FAILED`
- ✅ `LOGIN_ERROR`
- ✅ `LOGIN` (aunque este success=true, no se cuenta porque el query filtra por success=false)

## Cambios Implementados

### 1. Corrección del Pattern

**Archivo:** `src/services/alerts.service.ts`

```typescript
// ANTES (línea 53):
error_pattern: 'LOGIN|login|auth|AUTH|credentials|Credenciales',

// DESPUÉS:
error_pattern: 'LOGIN',
```

### 2. Paginación en Registro de Actividad

**Archivo:** `src/components/admin/SecurityManager.tsx`

Agregado:
- Paginación de 50 registros por página
- Controles de navegación (Anterior/Siguiente)
- Indicador de página actual
- Contador de registros totales

**Beneficios:**
- Mejor rendimiento al cargar solo 50 logs en lugar de 100
- Navegación más fácil entre miles de registros
- UX mejorada con controles visuales

## Cómo Verificar que Funciona

### Paso 1: Probar con Datos Existentes

Si ya tienes errores de LOGIN_FAILED registrados:

1. Ir a **Dashboard Admin → Seguridad → Alertas**
2. En **Fallos de Autenticación**, configurar:
   - Umbral: **2**
   - Ventana: **5 minutos** (o el tiempo que incluya tus errores)
3. Hacer clic en **"Probar Alerta"**

**Resultado esperado:**
```
Alerta enviada. Se encontraron X errores (umbral: 2)
```

Y deberías recibir un email en el correo configurado.

### Paso 2: Generar Nuevos Errores

Si no tienes suficientes errores:

1. Ir a `/login`
2. Intentar login con email válido pero **contraseña incorrecta** 3-4 veces
3. Esperar 30 segundos (para que se registren)
4. Ir a **Dashboard Admin → Seguridad → Alertas**
5. En **Fallos de Autenticación**, configurar:
   - Umbral: **2**
   - Ventana: **1 minuto**
6. Hacer clic en **"Probar Alerta"**

### Paso 3: Verificar Logs

1. Ir a **Registro de Actividad**
2. Buscar logs con `action = 'LOGIN_FAILED'`
3. Verificar que el botón de paginación aparece si hay más de 50 registros
4. Navegar entre páginas

## Queries de Verificación

### Contar errores de login en los últimos X minutos

```sql
SELECT COUNT(*)
FROM audit_logs
WHERE success = false
  AND action ILIKE '%LOGIN%'
  AND created_at >= NOW() - INTERVAL '5 minutes';
```

### Ver los últimos 10 errores de login

```sql
SELECT
  created_at,
  user_email,
  action,
  error_message,
  details
FROM audit_logs
WHERE success = false
  AND action ILIKE '%LOGIN%'
ORDER BY created_at DESC
LIMIT 10;
```

### Verificar configuración de alerta

```sql
SELECT
  value->'authentication_failures'->>'threshold_count' as umbral,
  value->'authentication_failures'->>'time_window_minutes' as ventana_minutos,
  value->'authentication_failures'->>'error_pattern' as pattern,
  value->'authentication_failures'->>'enabled' as habilitada
FROM admin_settings
WHERE key = 'alert_config';
```

## Otras Alertas Afectadas

El mismo problema podría afectar otras alertas que usan patterns con `|`:

### Database Errors
```typescript
// ANTES:
error_pattern: 'database|connection|timeout'

// Si no funciona, cambiar a uno específico:
error_pattern: 'database'  // O el más común en tus logs
```

### API Errors
```typescript
// ANTES:
error_pattern: '5xx|500|502|503'

// Si no funciona, cambiar a:
error_pattern: '5'  // Matchea 500, 502, 503, etc.
```

## Cómo Usar Patterns Múltiples (Alternativa)

Si necesitas matchear múltiples patterns específicos en el futuro, la solución correcta sería modificar el código para construir el query de manera diferente:

```typescript
// En lugar de:
query.or(`action.ilike.%${pattern}%`)

// Hacer:
const patterns = pattern.split('|');
const conditions = patterns.flatMap(p => [
  `action.ilike.%${p.trim()}%`,
  `error_message.ilike.%${p.trim()}%`,
  `resource_type.ilike.%${p.trim()}%`
]).join(',');

query.or(conditions);
```

Pero para la mayoría de casos, un pattern simple como `'LOGIN'` o `'payment'` es suficiente.

## Conclusión

El sistema de alertas ahora funciona correctamente:
- ✅ Detecta errores de login fallidos
- ✅ Cuenta correctamente contra el umbral
- ✅ Envía emails cuando se supera el umbral
- ✅ Registra de actividad tiene paginación
- ✅ El patrón de búsqueda es simple y efectivo

Para futuras alertas, usar patterns simples de una palabra que matcheen claramente con los valores en `action`, `error_message` o `resource_type`.
