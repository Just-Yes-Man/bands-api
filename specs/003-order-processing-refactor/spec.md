# Feature Specification: Procesamiento Orientado a Pedidos

**Feature Branch**: `003-order-processing-refactor`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "Refactoriza el sistema para pasar de procesar productos individuales a procesar pedidos completos..."

## Clarifications

### Session 2026-04-04

- Q: Que modelo de actualizacion de progreso por linea se utilizara en runtime? -> A: Option B (actualizacion incremental con deltas y control de concurrencia)
- Q: Que prioridad tendran los estados terminales ante conflicto entre cierre y cancelacion? -> A: Option A (CANCELADO tiene prioridad absoluta)
- Q: Que modelo de autorizacion se aplicara para crear y consultar pedidos? -> A: Option A (cualquier usuario autenticado puede crear y consultar pedidos)
- Q: Que garantias de entrega se aplicaran en eventos realtime de pedidos? -> A: Option A (eventos criticos con ack+retry; informativos en best-effort)
- Q: Como se manejara la cancelacion de lineas dentro de un pedido? -> A: Option B (cancelacion parcial por linea; pedido cancelado solo si todas sus lineas quedan canceladas o la cabecera se cancela)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear Pedido con Multiples Lineas (Priority: P1)

Como operador del sistema, quiero crear pedidos con multiples lineas de producto y cantidades para que el flujo de produccion se gestione por pedido completo y no por producto suelto.

**Why this priority**: Es el cambio estructural principal del negocio; sin creacion de pedidos no existe el nuevo modelo operativo.

**Independent Test**: Puede validarse creando un pedido con varias lineas y comprobando persistencia de cabecera y lineas con estado inicial coherente.

**Acceptance Scenarios**:

1. **Given** un cliente existente y una lista valida de modelos con cantidades, **When** se crea un pedido, **Then** el sistema registra el pedido en estado `PENDIENTE` con todas sus lineas.
2. **Given** una solicitud con lineas duplicadas para el mismo modelo, **When** se intenta crear el pedido, **Then** el sistema rechaza la solicitud con error de validacion claro.

---

### User Story 2 - Consultar Pedidos y Detalle de Progreso (Priority: P2)

Como cliente o supervisor, quiero consultar pedidos y su detalle de progreso para conocer estado real y trazabilidad operativa.

**Why this priority**: Permite visibilidad operativa y trazabilidad del avance de produccion por pedido.

**Independent Test**: Puede validarse consultando listado por cliente y detalle por pedido, confirmando que el estado y contadores reflejan el progreso acumulado.

**Acceptance Scenarios**:

1. **Given** un cliente con varios pedidos propios, **When** consulta su historial, **Then** recibe lista paginada solo de sus pedidos con estado resumido por pedido.
2. **Given** un pedido existente con lineas parcialmente procesadas, **When** se consulta el detalle, **Then** se muestran lineas con `cantidad`, `procesadas`, `rechazadas` y progreso total del pedido.

---

### User Story 3 - Actualizacion Automatizada de Estado del Pedido (Priority: P3)

Como sistema de control, quiero actualizar automaticamente el estado del pedido conforme avanza el procesamiento para evitar actualizaciones manuales y mantener consistencia.

**Why this priority**: Asegura integridad de negocio y prepara integracion con medicion en tiempo real.

**Independent Test**: Puede validarse simulando actualizaciones de lineas y verificando transiciones de estado del pedido (`PENDIENTE` -> `EN_PROCESO` -> `COMPLETADO` o `CANCELADO`).

**Acceptance Scenarios**:

1. **Given** un pedido con lineas sin procesar, **When** se reporta avance parcial, **Then** el pedido cambia a `EN_PROCESO`.
2. **Given** un pedido cuyas lineas alcanzan su cierre (procesadas + rechazadas = cantidad), **When** finaliza la ultima linea, **Then** el pedido cambia a `COMPLETADO`.
3. **Given** un pedido cancelado por negocio, **When** se consulta su estado, **Then** se presenta `CANCELADO` y no acepta nuevas actualizaciones de progreso.

### Edge Cases

- Creacion de pedido con `cliente_id` inexistente.
- Lineas con `cantidad` en 0 o negativa.
- Registro concurrente de progreso en la misma linea que podria exceder la `cantidad`.
- Intento de actualizar progreso sobre un pedido `CANCELADO`.
- Cancelacion parcial que deje el pedido sin lineas activas pendientes de procesamiento.
- Pedido sin lineas validas tras validaciones de entrada.
- Consulta de pedidos sin token JWT valido.
- Consulta de detalle de pedido de otro cliente sin permisos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir crear pedidos con una o mas lineas de pedido en una unica solicitud.
- **FR-002**: El sistema MUST validar que cada linea tenga `modelo_producto_id` valido y `cantidad` mayor que cero.
- **FR-003**: El sistema MUST impedir lineas duplicadas del mismo modelo dentro del mismo pedido.
- **FR-004**: El sistema MUST persistir los pedidos y lineas con contadores iniciales (`procesadas=0`, `rechazadas=0`) y estado inicial `PENDIENTE`.
- **FR-005**: El sistema MUST exponer consulta de pedidos por cliente y consulta de detalle por pedido.
- **FR-006**: El sistema MUST calcular y devolver progreso agregado del pedido (totales y porcentaje de avance).
- **FR-007**: El sistema MUST actualizar automaticamente el estado del pedido segun avance de lineas y reglas de negocio, usando actualizaciones incrementales de `procesadas` y `rechazadas` por linea.
- **FR-008**: El sistema MUST bloquear actualizaciones de progreso para pedidos en estado `CANCELADO`.
- **FR-009**: El sistema MUST registrar eventos de auditoria de cambios de estado y progreso de pedidos.
- **FR-010**: El sistema MUST mantener separacion por capas (controller, service, repository) para el dominio de pedidos.
- **FR-011**: El sistema MUST aplicar control de concurrencia en actualizaciones de progreso por linea (optimistic locking o equivalente) para evitar sobreconteo y mantener consistencia ante reportes simultaneos.
- **FR-012**: El sistema MUST tratar `CANCELADO` como estado terminal de maxima prioridad; una vez cancelado, el pedido no puede transicionar a `COMPLETADO` ni recibir cierres posteriores.
- **FR-013**: El sistema MUST permitir cancelacion parcial por linea; el pedido solo cambia a `CANCELADO` cuando todas las lineas quedan canceladas o cuando se cancela explicitamente la cabecera.

Backend constitution coverage (mandatory when applicable):

- **FR-SEC-001**: Endpoints de pedidos MUST requerir JWT valido y autorizacion por rol/contexto; `admin` y `supervisor` pueden consultar pedidos globales, `cliente` solo puede consultar sus propios pedidos, y operaciones de actualizacion de progreso deben limitarse a actores operativos autorizados.
- **FR-RT-001**: El dominio de pedidos MUST definir eventos realtime versionados para actualizacion de progreso y cambios de estado, con semantica de ack/error documentada.
- **FR-RT-002**: Eventos realtime criticos de progreso/estado MUST usar `ack + retry` con politica de expiracion documentada; eventos informativos MUST operar en best-effort.
- **FR-DATA-001**: El sistema MUST crear y versionar migraciones para `pedidos` y `lineas_pedido`, incluyendo restricciones de integridad referencial y unicidad.
- **FR-DATA-002**: Cada cambio de estado de pedido MUST ser trazable con marca temporal y contexto de actor/proceso.
- **FR-OPS-001**: La funcionalidad MUST ejecutarse en entorno Docker existente, con healthcheck operativo y migraciones aplicables al arranque.
- **FR-DOC-001**: Swagger/OpenAPI MUST documentar endpoints de creacion, listado por cliente, detalle y consulta de progreso.

### Key Entities *(include if feature involves data)*

- **Pedido**: Representa la cabecera de una orden de produccion de un cliente con estado global (`PENDIENTE`, `EN_PROCESO`, `COMPLETADO`, `CANCELADO`) y fechas de control.
- **LineaPedido**: Representa cada modelo solicitado dentro de un pedido, con `cantidad`, `procesadas` y `rechazadas` para seguimiento granular.
- **ProgresoPedido**: Vista de negocio derivada que consolida totales del pedido (solicitadas, procesadas, rechazadas, restantes, porcentaje).
- **EventoEstadoPedido**: Registro auditable de transiciones de estado y actualizaciones relevantes de progreso.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% de las solicitudes validas de creacion de pedido con hasta 20 lineas se completan en menos de 2 segundos.
- **SC-002**: 95% de las consultas de listado por cliente y detalle de pedido responden en menos de 1 segundo.
- **SC-003**: 100% de los pedidos nuevos se crean en estado `PENDIENTE` con contadores iniciales correctos.
- **SC-004**: 100% de las transiciones de estado observadas cumplen las reglas definidas (`PENDIENTE` -> `EN_PROCESO` -> `COMPLETADO` o `CANCELADO`).
- **SC-007**: 100% de conflictos entre evento de cierre y cancelacion resultan en estado final `CANCELADO`.
- **SC-008**: 100% de eventos realtime criticos de pedidos alcanzan confirmacion (`ack`) o quedan registrados como expirados/reintentados segun politica.
- **SC-009**: 100% de cancelaciones parciales mantienen consistencia entre detalle de lineas y estado agregado del pedido.
- **SC-005**: 100% de intentos de actualizacion sobre pedidos `CANCELADO` son rechazados.
- **SC-006**: Al menos 90% de usuarios operativos completan el flujo crear pedido + consultar progreso en su primer intento.
- **SC-010**: 100% de accesos no autorizados (sin JWT o fuera de alcance de rol/propiedad) a endpoints de pedidos son rechazados.

## Assumptions

- La tabla `clientes` y `modelos_producto` ya existen y contienen identificadores validos para relacionar pedidos y lineas.
- La autenticacion JWT vigente en el backend se reutiliza para proteger endpoints del dominio de pedidos.
- La cancelacion de pedidos es una accion explicita de negocio y no depende de timeout automatico en esta version.
- La primera iteracion cubre pedidos unitarios (sin particion por multiples plantas o centros).
- La integracion con mediciones en tiempo real se deja preparada mediante contratos/eventos, pero la fuente externa de medicion puede evolucionar en incrementos posteriores.
