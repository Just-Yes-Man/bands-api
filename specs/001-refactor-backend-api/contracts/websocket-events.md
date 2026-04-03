# WebSocket Contract: Conveyor Backend (`v1`)

## Transport and Auth
- Protocol: Socket.IO
- Namespace: `/realtime/v1` (or equivalent v1-scoped namespace)
- Auth: JWT required during handshake for protected channels
- Roles:
  - `admin`: management and supervisory streams
  - `supervisor`: monitoring + supervisory operational streams
  - `operator`: operational streams only

## Delivery Semantics
- Critical events: acknowledgment required with bounded retry policy.
- Informative events: best-effort delivery (no mandatory retry tracking).
- Event names are major-versioned (`*.v1`).
- Runtime payload validation is mandatory for all command events.

## Client -> Server Events

### `product-model.create.v1` (critical)
- Purpose: Create product model
- Roles: `admin`
- Payload:
  - `type` (string)
  - `qrCode` (string)
  - `expectedWeight` (number)
  - `expectedColor` (string)
  - `expectedHeight` (number)
- Ack response:
  - success: `{ ok: true, data: { id, ... } }`
  - error: `{ ok: false, error: { code, message } }`

### `checkpoint.register.v1` (critical)
- Purpose: Register product checkpoint metrics
- Roles: `operator`, `supervisor`
- Payload:
  - `measuredQr` (string)
  - `measuredWeight` (number)
  - `measuredColor` (string)
  - `measuredHeight` (number)
  - `channel` (string, optional)
- Ack response:
  - success: `{ ok: true, data: { checkpointId, status } }`
  - error: `{ ok: false, error: { code, message } }`

### `checkpoint.review-next.v1` (critical)
- Purpose: Trigger review of next queued checkpoint for monitor
- Roles: `supervisor`
- Payload:
  - `monitorId` (number)
- Ack response:
  - success: `{ ok: true, data: { checkpointId, approved, result } }`
  - empty: `{ ok: true, data: null }`
  - error: `{ ok: false, error: { code, message } }`

## Server -> Client Events

### `state.snapshot.v1` (informative)
- Purpose: Initial state on successful connection
- Payload:
  - `activeMonitors` (array)
  - `pendingCount` (number)
  - `latestReviews` (array)

### `checkpoint.queued.v1` (critical)
- Purpose: Notify accepted checkpoint
- Payload:
  - `checkpointId` (number)
  - `status` (`queued`)
  - `channel` (string)

### `checkpoint.reviewed.v1` (critical)
- Purpose: Notify reviewed checkpoint outcome
- Payload:
  - `checkpointId` (number)
  - `approved` (boolean)
  - `result` (object with weight/color/height booleans)
  - `monitorId` (number|null)

### `state.metrics-updated.v1` (informative)
- Purpose: Push aggregate counters
- Payload:
  - `pendingCount` (number)
  - `latestReviews` (array)

## Error Contract
- Server-side errors use shape:
  - `{ ok: false, error: { code: string, message: string, traceId?: string } }`
- Recommended codes:
  - `AUTH_UNAUTHORIZED`
  - `AUTH_FORBIDDEN`
  - `VALIDATION_ERROR`
  - `NOT_FOUND`
  - `CONFLICT`
  - `INTERNAL_ERROR`

## Compatibility and Deprecation
- Legacy non-versioned events may coexist temporarily during strangler rollout.
- Deprecation policy:
  - Announce replacement event version.
  - Keep compatibility window.
  - Remove legacy event once acceptance criteria and telemetry thresholds are met.
