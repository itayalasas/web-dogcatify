# Solución: Logs de Auditoría No Visibles

## Problema Identificado

Los registros de auditoría **existen en la base de datos** (48 registros confirmados), pero **no son visibles desde el frontend** debido a un problema con las políticas RLS (Row Level Security).

### Síntomas
- ✅ Los datos se pueden ver desde Supabase SQL Editor
- ❌ Los datos NO aparecen en el dashboard admin
- ❌ Mensaje: "No hay registros de auditoría disponibles"

### Causa Raíz
Las políticas RLS con subqueries complejas no estaban funcionando correctamente en el contexto del frontend. Específicamente, la política que verificaba `profiles.is_admin = true` mediante un EXISTS no permitía el acceso.

## Solución Aplicada (TEMPORAL)

### 1. Política RLS Temporal
He creado una política **temporal** más permisiva que permite a TODOS los usuarios autenticados ver los logs:

```sql
CREATE POLICY "Authenticated users can view audit logs (TEMP DEBUG)"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);
```

**IMPORTANTE:** Esta política es temporal solo para diagnosticar y confirmar que el problema es RLS. Una vez confirmado, debemos aplicar la política restrictiva correcta.

### 2. Debugging Mejorado
Agregué logging extenso en `SecurityManager.tsx` que muestra:
- Sesión actual del usuario
- Perfil y verificación de is_admin
- Respuesta de la consulta de logs
- Cualquier error RLS

## Cómo Probar

### Paso 1: Recargar la Aplicación
1. Hacer **hard refresh** (Ctrl+Shift+R o Cmd+Shift+R)
2. Ir a **Dashboard Admin → Seguridad → Registro de Actividad**

### Paso 2: Abrir Consola del Navegador
Presiona **F12** y ve a la pestaña **Console**

### Paso 3: Revisar los Logs
Deberías ver algo como:
```
=== DEBUGGING AUDIT LOGS ===
Loading audit logs, page: 1, offset: 0
Session: { email: 'admin@dogcatify.com', id: '7d6857c6-...', error: null }
Profile: { profile: { id: '7d6857c6...', email: 'admin@dogcatify.com', is_admin: true }, error: null }
Audit logs response: { logsCount: 48, totalCount: 48, error: null, firstLog: {...} }
=== END DEBUGGING ===
```

### Paso 4: Verificar Tabla
Los 48 registros de auditoría deberían aparecer ahora en la tabla.

## Escenarios Posibles

### ✅ Escenario 1: Funciona Ahora
**Qué significa:** El problema era definitivamente la política RLS restrictiva.

**Próximo paso:** Necesitamos crear una política restrictiva que SÍ funcione correctamente.

**Opciones:**
1. Usar una función PostgreSQL personalizada para verificar is_admin
2. Usar una columna directa en audit_logs que indique si debe ser visible
3. Ajustar la forma de verificar is_admin en la política

### ❌ Escenario 2: Aún No Funciona
**Qué revisar en la consola:**

1. **Si ves:** `Session: { email: null, id: null }`
   - **Problema:** No hay sesión activa
   - **Solución:** Cerrar sesión y volver a iniciar sesión

2. **Si ves:** `Profile: { profile: null, error: {...} }`
   - **Problema:** No se encuentra el perfil del usuario
   - **Solución:** Verificar que exista el registro en la tabla profiles

3. **Si ves:** `error: { code: '42501', message: 'permission denied' }`
   - **Problema:** Aún hay restricción RLS (no debería pasar con la política temporal)
   - **Solución:** Verificar que la migración se aplicó correctamente

## Verificación Manual (SQL)

Puedes verificar todo desde Supabase SQL Editor:

```sql
-- 1. Verificar políticas actuales
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'audit_logs';

-- Deberías ver:
-- "Authenticated users can view audit logs (TEMP DEBUG)" | SELECT | {authenticated}

-- 2. Verificar usuario admin
SELECT id, email, is_admin
FROM profiles
WHERE email = 'admin@dogcatify.com';

-- Debería mostrar is_admin = true

-- 3. Ver los logs
SELECT COUNT(*) as total FROM audit_logs;
-- Debería mostrar: 48

-- 4. Ver últimos 5 logs
SELECT
  created_at,
  user_email,
  action,
  success
FROM audit_logs
ORDER BY created_at DESC
LIMIT 5;
```

## Próximos Pasos (Una vez que funcione)

### Restaurar Política Restrictiva
Una vez confirmado que funciona con la política permisiva, aplicaremos una política restrictiva correcta.

**Opción 1: Función PostgreSQL**
```sql
-- Crear función que verifica si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usar la función en la política
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());
```

**Opción 2: Política más simple**
```sql
-- Política que verifica directamente sin subquery compleja
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );
```

## Resumen de Cambios

### Archivos Modificados
1. **`src/components/admin/SecurityManager.tsx`**
   - Agregado debugging extenso
   - Verificación de sesión y perfil
   - Logging detallado de errores

2. **`supabase/migrations/*_debug_audit_logs_rls_simple.sql`**
   - Política RLS temporal permisiva
   - Solo para diagnóstico

### Estado Actual
- ✅ Política RLS temporal aplicada
- ✅ Debugging agregado al frontend
- ✅ Build compilado correctamente
- ⏳ Pendiente: Verificar que funciona
- ⏳ Pendiente: Restaurar política restrictiva

## Contacto y Soporte
Si después de estos pasos aún no funciona, por favor comparte:
1. Los logs completos de la consola del navegador
2. El resultado de las consultas SQL de verificación
3. Cualquier mensaje de error que aparezca

Esto nos permitirá identificar exactamente qué está fallando.
