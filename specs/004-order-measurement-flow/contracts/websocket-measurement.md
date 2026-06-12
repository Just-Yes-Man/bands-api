# WebSocket Contracts: Measurement Realtime

## Namespace
- Protected namespace: /realtime/v1

## Auth
- JWT required via handshake.auth.token or Authorization: Bearer <token>.
- Invalid/missing token rejects handshake with generic auth error.

## Versioning
- Events are versioned using .v1 suffix.
- Breaking changes require new versioned event names and migration notes.

## Critical Events (ack + retry)

### measurement.process.state.changed.v1
- Type: critical
- Direction: server -> clients
- Payload:
  - processId (number)
  - orderId (number)
  - lineId (number|null)
  - previousState (string)
  - currentState (string)
  - occurredAt (ISO timestamp)
  - correlationId (string)
- Ack semantics:
  - Client acknowledges { ok: true, correlationId }
  - Server retries with bounded attempts when no ack.
  - Expired deliveries are auditable.

### measurement.progress.applied.v1
- Type: critical
- Direction: server -> clients
- Payload:
  - processId (number)
  - orderId (number)
  - lineId (number|null)
  - measurementId (number)
  - measurementResult (PENDIENTE|APROBADA|RECHAZADA)
  - deltaProcesadas (number)
  - deltaRechazadas (number)
  - occurredAt (ISO timestamp)
  - correlationId (string)
- Ack semantics:
  - Same policy as measurement.process.state.changed.v1

## Informational Events (best-effort)

### measurement.process.started.v1
- Type: informative
- Direction: server -> clients
- Payload:
  - processId (number)
  - orderId (number)
  - lineId (number|null)
  - startedAt (ISO timestamp)

### measurement.recorded.v1
- Type: informative
- Direction: server -> clients
- Payload:
  - processId (number)
  - measurementId (number)
  - result (PENDIENTE|APROBADA|RECHAZADA)
  - capturedAt (ISO timestamp)

## Error Events

### pedido.inspeccion.error
- Direction: server -> client
- Payload:
  - orderId (number)
  - lineId (number)
  - modeloProductoId (number, optional)
  - reason (string)
  - expected (object, optional)
  - received (object, optional)
  - faultyIdempotencyKey (string, optional)
  - occurredAt (ISO timestamp)
- Error policy:
  - Messages must avoid sensitive internal details.
  - JWT failures use generic auth semantics.
