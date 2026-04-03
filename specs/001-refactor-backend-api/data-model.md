# Data Model: Refactor Backend API for Conveyor System

## Entity: OperatorIdentity
- Purpose: Represents authenticated actor context used for authorization and auditability.
- Fields:
  - id (uuid or serial reference)
  - username (string, unique)
  - role (enum: admin | supervisor | operator)
  - active (boolean)
  - createdAt (timestamp)
  - lastLoginAt (timestamp, nullable)
- Validation rules:
  - role must be one of `admin`, `supervisor`, `operator`
  - inactive users cannot obtain valid session tokens
- Relationships:
  - One-to-many with ProductCheckpointEvent as `performedBy`

## Entity: ProductModel
- Purpose: Defines expected attributes for product verification in conveyor checkpoints.
- Fields:
  - id (serial)
  - type (string, unique, required)
  - qrCode (string, unique, required)
  - expectedWeight (number/int, required)
  - expectedColor (string, required)
  - expectedHeight (number/int, required)
  - active (boolean, default true)
  - createdAt (timestamp)
  - updatedAt (timestamp)
- Validation rules:
  - expectedWeight and expectedHeight must be non-negative
  - type and qrCode are unique among active models
- Relationships:
  - One-to-many with ProductCheckpointEvent
- State transitions:
  - active -> inactive (deprecation/operational retirement)
  - inactive -> active (reactivation, admin only)

## Entity: ProcessMonitor
- Purpose: Represents a conveyor monitoring station or channel endpoint.
- Fields:
  - id (serial)
  - name (string, required)
  - channel (string, required)
  - active (boolean, default true)
  - createdAt (timestamp)
- Validation rules:
  - channel must be non-empty and normalized
- Relationships:
  - One-to-many with ProductCheckpointEvent
- State transitions:
  - active -> inactive (maintenance/outage)
  - inactive -> active (service restored)

## Entity: ProductCheckpointEvent
- Purpose: Captures each measured product step, expected model comparison, and decision outcome.
- Fields:
  - id (serial)
  - externalReference (string, optional client reference)
  - measuredQr (string, required)
  - measuredWeight (number/int, required)
  - measuredColor (string, required)
  - measuredHeight (number/int, required)
  - modelId (fk ProductModel.id)
  - monitorId (fk ProcessMonitor.id, nullable pre-assignment)
  - channel (string, required)
  - decisionWeightOk (boolean)
  - decisionColorOk (boolean)
  - decisionHeightOk (boolean)
  - approved (boolean)
  - status (enum: received | queued | reviewed | published)
  - performedBy (fk OperatorIdentity.id, nullable for system actions)
  - createdAt (timestamp)
  - reviewedAt (timestamp, nullable)
- Validation rules:
  - measured fields are required for write operations
  - status transitions must follow valid sequence
- Relationships:
  - Many-to-one ProductModel
  - Many-to-one ProcessMonitor
  - Many-to-one OperatorIdentity
- State transitions:
  - received -> queued (accepted by API)
  - queued -> reviewed (business evaluation completed)
  - reviewed -> published (realtime event emitted)
  - Any state -> reviewed with rejection flags when validation fails

## Entity: RealtimeDeliveryRecord (Critical Events)
- Purpose: Tracks acknowledgment/retry lifecycle for critical websocket events.
- Fields:
  - id (serial)
  - eventName (string, versioned)
  - eventType (enum: critical | informative)
  - correlationId (string)
  - checkpointEventId (fk ProductCheckpointEvent.id, nullable)
  - attempts (int)
  - acked (boolean)
  - ackedAt (timestamp, nullable)
  - expiresAt (timestamp)
- Validation rules:
  - critical events require attempts >= 1 and retry cap
  - informative events may omit tracking record
- Relationships:
  - Optional many-to-one ProductCheckpointEvent
- State transitions:
  - pending -> retrying -> acked
  - pending/retrying -> expired (retry limit reached)

## Cross-Entity Constraints
- ProductCheckpointEvent must reference an active ProductModel at acceptance time.
- Role constraints:
  - admin: can mutate ProductModel and ProcessMonitor lifecycle/configuration.
  - supervisor: can trigger supervisory review and monitoring actions.
  - operator: can execute operational flows but cannot change master configuration.
- Auditability:
  - Protected state changes must capture `performedBy` and timestamp metadata.
