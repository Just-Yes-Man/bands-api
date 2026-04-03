# Data Model: Registro y Login de Clientes

## Entity: ClientAccount
- Purpose: Represents a registered client identity persisted in PostgreSQL.
- Existing base table: `clientes`
- Fields:
  - id (serial, primary key)
  - nombre (string, unique login identifier)
  - contrasena (string, hashed password)
  - activo (boolean, optional extension for account status)
  - created_at (timestamp, optional extension for auditability)
- Validation rules:
  - `nombre` must be non-empty and unique
  - password policy: minimum 8 characters with at least one numeric digit
  - stored password must be hash-only (never plaintext)
- State transitions:
  - active -> inactive (administrative deactivation)
  - inactive -> active (reactivation)

## Entity: ClientSessionToken
- Purpose: Represents issued JWT access token context for authenticated client actions.
- Fields (logical claims):
  - sub (client id)
  - username (`nombre`)
  - role (client role context)
  - iat (issued-at)
  - exp (expiration, 1 hour)
  - iss / aud (issuer/audience security claims)
- Validation rules:
  - token must be signed with configured secret
  - token expiry is mandatory at 1 hour
  - invalid/expired tokens are rejected on protected routes/channels

## Entity: AuthenticationAuditEvent
- Purpose: Capture auditable register/login outcomes and failure reasons for internal analysis.
- Fields:
  - id (serial)
  - event_type (enum: register_success, register_failure, login_success, login_failure)
  - client_identifier (string)
  - source_ip (string)
  - outcome (enum: success, failure)
  - reason_code (string, internal only)
  - created_at (timestamp)
- Validation rules:
  - failure events must avoid exposing sensitive cause in client response
  - audit record must include timestamp and identifier context

## Entity: LoginRateLimitWindow
- Purpose: Track login attempt budgets over time windows by identifier/IP.
- Fields:
  - key (identifier+ip composite key)
  - attempts (integer)
  - window_start (timestamp)
  - window_end (timestamp)
- Validation rules:
  - attempts above threshold trigger login rejection with generic error response
  - no permanent lock state in this feature version

## Cross-Entity Constraints
- `ClientAccount.nombre` uniqueness must be guaranteed at DB level.
- Register/login endpoints remain public, but all protected operations require valid JWT.
- Realtime protected channels use the same JWT verification policy as REST.
