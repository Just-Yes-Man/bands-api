# WebSocket Contracts: Orders Realtime

## Namespace
- Protected namespace: `/realtime/v1`

## Auth
- JWT required via `handshake.auth.token` or `Authorization: Bearer <token>`.
- Invalid/missing token rejects handshake with generic auth error.

## Versioning
- Events are versioned using `.v1` suffix.
- Breaking changes require new event version and migration notes.

## Critical Events (ack + retry)

### `order.progress.updated.v1`
- Type: critical
- Direction: server -> clients
- Payload:
  - `orderId` (number)
  - `lineId` (number)
  - `deltaProcesadas` (number)
  - `deltaRechazadas` (number)
  - `estadoPedido` (string)
  - `occurredAt` (ISO timestamp)
  - `correlationId` (string)
- Ack semantics:
  - Client must acknowledge `{ ok: true, correlationId }`.
  - Server retries up to configured attempts if ack missing.
  - Expired retries must be persisted in delivery/audit records.

### `order.status.changed.v1`
- Type: critical
- Direction: server -> clients
- Payload:
  - `orderId` (number)
  - `previousStatus` (string)
  - `currentStatus` (string)
  - `reason` (string)
  - `occurredAt` (ISO timestamp)
  - `correlationId` (string)
- Ack semantics:
  - Same policy as `order.progress.updated.v1`.

## Informational Events (best-effort)

### `order.summary.updated.v1`
- Type: informative
- Direction: server -> clients
- Payload:
  - `orderId` (number)
  - `totalProcesadas` (number)
  - `totalRechazadas` (number)
  - `totalCanceladas` (number)
  - `porcentajeAvance` (number)
- Delivery semantics:
  - No ack required.
  - Latest state can be recovered from REST detail endpoint.

## Error Events

### `order.error.v1`
- Direction: server -> client
- Payload:
  - `code` (string)
  - `message` (string)
  - `correlationId` (string, optional)
- Error policy:
  - Messages must avoid sensitive details.
  - Authorization failures should use generic auth semantics.
