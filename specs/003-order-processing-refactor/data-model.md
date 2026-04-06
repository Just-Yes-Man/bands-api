# Data Model: Procesamiento Orientado a Pedidos

## Entity: Pedido
- Purpose: Cabecera de orden de produccion agrupando multiples lineas por cliente.
- Fields:
  - id (serial, PK)
  - cliente_id (int, FK -> clientes.id)
  - estado (enum: PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO)
  - created_at (timestamptz)
  - updated_at (timestamptz)
  - version (int, control de concurrencia optimista)
- Validation rules:
  - `cliente_id` debe existir.
  - `estado` inicia en `PENDIENTE`.
- State transitions:
  - PENDIENTE -> EN_PROCESO
  - EN_PROCESO -> COMPLETADO
  - PENDIENTE/EN_PROCESO -> CANCELADO (terminal)
  - CANCELADO -> (sin transiciones)

## Entity: LineaPedido
- Purpose: Item de pedido por modelo con seguimiento de cantidad y avance.
- Fields:
  - id (serial, PK)
  - pedido_id (int, FK -> pedidos.id)
  - modelo_producto_id (int, FK -> modelos_producto.id)
  - cantidad (int > 0)
  - procesadas (int >= 0)
  - rechazadas (int >= 0)
  - estado_linea (enum: ACTIVA, CANCELADA, CERRADA)
  - created_at (timestamptz)
  - updated_at (timestamptz)
  - version (int, control de concurrencia optimista)
- Validation rules:
  - Unicidad (`pedido_id`, `modelo_producto_id`).
  - `procesadas + rechazadas <= cantidad` para lineas activas.
  - `estado_linea=CANCELADA` impide nuevas actualizaciones.

## Entity: PedidoStateEvent
- Purpose: Auditoria de transiciones y cambios relevantes de progreso.
- Fields:
  - id (serial, PK)
  - pedido_id (int, FK -> pedidos.id)
  - linea_pedido_id (int nullable, FK -> lineas_pedido.id)
  - event_type (enum: CREATED, LINE_PROGRESS, LINE_CANCELED, STATUS_CHANGED, CANCELED)
  - actor_type (enum: USER, SYSTEM)
  - actor_id (string)
  - payload (jsonb)
  - created_at (timestamptz)
- Validation rules:
  - Cada transicion de estado de cabecera genera evento `STATUS_CHANGED`.
  - Actualizaciones criticas generan evento trazable con actor y payload.

## Derived View: ProgresoPedido
- Purpose: Resumen de avance agregado para endpoints de consulta.
- Fields:
  - total_lineas
  - total_solicitadas
  - total_procesadas
  - total_rechazadas
  - total_canceladas
  - total_restantes
  - porcentaje_avance
- Computation rules:
  - `total_restantes = total_solicitadas - total_procesadas - total_rechazadas - total_canceladas`
  - `porcentaje_avance = (total_procesadas + total_rechazadas + total_canceladas) / total_solicitadas * 100`

## Cross-Entity Constraints
- Un pedido debe tener al menos una linea.
- `CANCELADO` en cabecera invalida cualquier nueva actualizacion de lineas.
- Si todas las lineas quedan `CANCELADA`, el pedido transiciona a `CANCELADO`.
- Si todas las lineas quedan cerradas (`CERRADA` o `CANCELADA`) y no hay cancelacion global, el pedido transiciona a `COMPLETADO`.
