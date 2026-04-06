# Research: Procesamiento Orientado a Pedidos

## Decision 1: Modelo de avance por linea
- Decision: Usar actualizaciones incrementales (`delta_procesadas`, `delta_rechazadas`) con control de concurrencia optimista.
- Rationale: Evita sobrescrituras en reportes concurrentes y facilita integracion con procesos de medicion asincronos.
- Alternatives considered:
  - Actualizacion absoluta de contadores: rechazada por mayor riesgo de race conditions.
  - Acumulacion solo en memoria: rechazada por perdida de trazabilidad y resiliencia.

## Decision 2: Prioridad de estados terminales
- Decision: `CANCELADO` tiene prioridad absoluta y es terminal.
- Rationale: Previene inconsistencias de negocio cuando llegan eventos tardios de cierre.
- Alternatives considered:
  - Prioridad para `COMPLETADO`: rechazada por romper regla de cancelacion explicita.
  - Resolver por timestamp mas reciente: rechazada por complejidad y ambiguedad operativa.

## Decision 3: Cancelacion parcial por lineas
- Decision: Permitir cancelacion por linea; pedido pasa a `CANCELADO` solo si todas las lineas quedan canceladas o si cabecera se cancela explicitamente.
- Rationale: Conserva flexibilidad operativa sin perder consistencia agregada del pedido.
- Alternatives considered:
  - Cancelacion total forzada ante cualquier linea cancelada: rechazada por impacto excesivo.
  - Solo cancelacion de cabecera: rechazada por falta de granularidad.

## Decision 4: Contratos realtime
- Decision: Eventos criticos de progreso/estado con `ack + retry`; eventos informativos en best-effort.
- Rationale: Balancea confiabilidad con costo de red/procesamiento.
- Alternatives considered:
  - Todo best-effort: rechazada por riesgo de desincronizacion.
  - Ack en todos los eventos: rechazada por sobrecosto sin beneficio en eventos no criticos.

## Decision 5: Seguridad de acceso en v1 de pedidos
- Decision: Endpoints de pedidos protegidos por JWT; cualquier usuario autenticado puede crear y consultar pedidos en esta version.
- Rationale: Alineado con clarificacion explicita del negocio para iteracion inicial.
- Alternatives considered:
  - Restriccion por rol/propiedad de cliente: diferida para hardening posterior.

## Decision 6: Persistencia para cancelacion parcial y trazabilidad
- Decision: Extender `lineas_pedido` con `estado_linea` (`ACTIVA`, `CANCELADA`, `CERRADA`) y agregar tabla de eventos de estado de pedido.
- Rationale: Permite representar cancelacion parcial de forma auditable y calcular estado agregado sin ambiguedad.
- Alternatives considered:
  - Solo usar contadores para inferir cancelacion: rechazada por baja expresividad y auditoria incompleta.
  - Tabla temporal de cancelaciones: rechazada por mayor complejidad de joins.

## Decision 7: Estrategia de migracion y operacion
- Decision: Migracion versionada en `src/infrastructure/db/migrations` para crear `pedidos`, `lineas_pedido` y `pedido_state_events` con rollback documentado.
- Rationale: Cumple constitucion de trazabilidad y despliegue reproducible en Docker.
- Alternatives considered:
  - Cambios manuales en DB: rechazados por falta de repetibilidad.

## Migration Rollback Notes
- Si es necesario revertir en entornos no productivos:
  - Eliminar tablas `pedido_state_events`, `lineas_pedido`, `pedidos` en ese orden.
  - Retirar constraints e indices asociados a lineas/pedidos.
- En productivo, preservar datos historicos y preferir rollback logico (feature flag) sobre drop fisico.
