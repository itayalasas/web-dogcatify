/*
  # Actualizar restricción de estados en pedidos

  1. Cambios en Orders
    - Elimina la restricción CHECK existente para estados
    - Crea una nueva restricción CHECK actualizada que incluye el estado "preparing"
  
  2. Estados Permitidos
    - pending: Pedido pendiente
    - payment_failed: Pago fallido
    - confirmed: Pedido confirmado
    - preparing: Preparando pedido (NUEVO)
    - processing: Procesando pedido
    - shipped: Pedido enviado
    - delivered: Pedido entregado
    - cancelled: Pedido cancelado
    - insufficient_stock: Stock insuficiente
    - reserved: Pedido reservado
  
  3. Nota
    - Esta actualización permite usar el estado "preparing" en el panel administrativo
*/

-- Eliminar la restricción CHECK existente
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Crear nueva restricción CHECK con todos los estados incluyendo "preparing"
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'payment_failed'::text, 
    'confirmed'::text, 
    'preparing'::text,
    'processing'::text, 
    'shipped'::text, 
    'delivered'::text, 
    'cancelled'::text, 
    'insufficient_stock'::text, 
    'reserved'::text
  ]));
