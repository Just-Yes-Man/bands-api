# Feature Specification: Registro y Login de Clientes

**Feature Branch**: `002-cliente-auth`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "dado que ya hay una tabla cliente solo falta implementarla en el sistema, anade un login y registro para los clientes."

## Clarifications

### Session 2026-03-31

- Q: Which session strategy should be used for client auth? -> A: Option A (access token JWT only, no refresh token)
- Q: What password policy should be required at registration? -> A: Option B (minimum 8 characters and at least 1 number)
- Q: What brute-force protection should be applied to login? -> A: Option B (rate limit by IP/user, no permanent lock)
- Q: What error disclosure policy should be used for login failures? -> A: Option B (single generic error message without cause disclosure)
- Q: What JWT expiration should be used for client sessions? -> A: Option B (1 hour)

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Registro de Cliente (Priority: P1)

Como cliente nuevo, quiero crear mi cuenta para poder acceder a las funciones del
sistema de bandas con una identidad propia.

**Why this priority**: Sin registro no existe identidad de cliente y por lo tanto no
es posible habilitar acceso autenticado.

**Independent Test**: Puede validarse enviando una solicitud de registro y confirmando
creacion exitosa, validaciones de duplicados y persistencia en la tabla de clientes.

**Acceptance Scenarios**:

1. **Given** que el cliente no existe, **When** envia nombre y contrasena validos,
  **Then** el sistema crea la cuenta y devuelve respuesta de exito.
2. **Given** que ya existe un cliente con el mismo nombre, **When** intenta
  registrarse de nuevo, **Then** el sistema rechaza el registro con error de
  conflicto claro.

---

### User Story 2 - Login de Cliente (Priority: P2)

Como cliente registrado, quiero iniciar sesion con mis credenciales para operar en el
sistema sin repetir autenticacion en cada accion.

**Why this priority**: Habilita el uso autenticado del sistema y permite aplicar
seguridad por identidad.

**Independent Test**: Puede validarse autenticando con credenciales validas e
invalidas, verificando emision de token y rechazo de credenciales incorrectas.

**Acceptance Scenarios**:

1. **Given** que el cliente existe y su contrasena es correcta, **When** hace login,
  **Then** el sistema devuelve token valido y datos basicos de sesion.
2. **Given** que la contrasena es incorrecta, **When** hace login, **Then** el
  sistema rechaza el acceso con respuesta uniforme de autenticacion fallida.

---

### User Story 3 - Integracion Segura con API y Realtime (Priority: P3)

Como equipo de desarrollo, queremos integrar la identidad de cliente en REST y
WebSocket para mantener coherencia de seguridad en todas las interfaces.

**Why this priority**: Asegura que login/registro no queden aislados y que la
autenticacion sea util en el sistema completo.

**Independent Test**: Puede validarse usando el token de login para consumir rutas y
canales protegidos y comprobando rechazo sin token.

**Acceptance Scenarios**:

1. **Given** un cliente autenticado, **When** accede a recursos protegidos, **Then**
  el sistema autoriza de acuerdo con su rol y contexto.
2. **Given** una solicitud sin token o con token invalido, **When** intenta consumir
  recursos protegidos, **Then** el sistema responde con error de autenticacion.

---

### Edge Cases

- Registro con nombre vacio o contrasena por debajo del minimo requerido.
- Registro con contrasena sin numero o con menos de 8 caracteres.
- Login de cliente inactivo o eliminado logicamente.
- Multiples intentos fallidos consecutivos en corto tiempo.
- Exceso de intentos de login en ventana corta desde misma IP o para mismo usuario.
- Uso de token expirado o manipulado en rutas/canales protegidos.
- Condicion de carrera cuando dos registros concurrentes intentan crear el mismo
  nombre de cliente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow new clients to register using a unique identifier
  and password.
- **FR-002**: The system MUST authenticate registered clients through a login flow and
  issue a valid short-lived access JWT session token.
- **FR-003**: Users MUST be able to receive clear and consistent errors for invalid
  registration and login attempts.
- **FR-004**: The system MUST persist client identity records in the existing client
  table without breaking current data.
- **FR-005**: The system MUST record security-relevant authentication events for
  auditing.

Backend constitution coverage (mandatory when applicable):

- **FR-SEC-001**: Registration and login endpoints MUST be public, while protected
  operational routes and realtime channels MUST require a valid JWT.
- **FR-SEC-003**: This feature version MUST use access-token-only JWT sessions and
  MUST NOT require refresh-token flows.
- **FR-SEC-002**: Passwords MUST never be stored in plain text and MUST be verified
  through secure comparison.
- **FR-SEC-004**: Registration MUST enforce a password policy of at least 8
  characters including at least one numeric digit.
- **FR-SEC-005**: Login MUST enforce rate limiting by client identifier and source IP
  within a configured time window, without permanent account lock in this version.
- **FR-SEC-006**: Login failure responses MUST use a single generic authentication
  error message that does not reveal whether the username or password was incorrect.
- **FR-SEC-007**: Client access JWTs issued by login MUST use a 1-hour expiration in
  this feature version.
- **FR-RT-001**: Realtime channels MUST accept only authenticated client connections
  when consuming protected events.
- **FR-DATA-001**: Client records MUST preserve uniqueness of the chosen login
  identifier and keep compatibility with existing schema constraints.
- **FR-DATA-002**: Authentication actions (register/login success and failure) MUST be
  auditable with timestamp and client identifier context.
- **FR-OPS-001**: The feature MUST run in existing Docker-based environments without
  requiring manual post-deploy schema patching.
- **FR-DOC-001**: API documentation MUST include registration and login contracts,
  including success and error responses.

### Key Entities *(include if feature involves data)*

- **Client Account**: Represents a client identity with unique login identifier,
  credential hash, status, and creation timestamp.
- **Client Session Token**: Represents issued authentication context used to access
  protected REST and realtime resources without refresh-token rotation in this version.
- **Authentication Audit Event**: Represents auditable record of register/login
  attempts with outcome and timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of valid registration requests are completed successfully in under 2
  seconds.
- **SC-002**: 95% of valid login requests return an authentication token in under 2
  seconds.
- **SC-003**: 100% of invalid login attempts are rejected without exposing sensitive
  credential details.
- **SC-004**: At least 90% of clients can complete register + first login flow on
  first attempt under normal conditions.
- **SC-005**: 100% of protected operations reject missing or invalid tokens.
- **SC-006**: 100% of registration attempts with passwords that do not meet the
  minimum policy are rejected with a consistent validation response.
- **SC-007**: 100% of login flows that exceed rate-limit thresholds are rejected with
  consistent and non-sensitive error responses.
- **SC-008**: 100% of failed login responses avoid credential-cause disclosure while
  preserving detailed audit context internally.
- **SC-009**: 100% of issued client JWTs include a 1-hour expiration claim aligned
  with configured security policy.

## Assumptions

- Existing `clientes` table is available and can be extended only if strictly needed
  for secure authentication behavior.
- Initial authentication scope is username/password login for clients; external SSO is
  out of scope for this increment.
- Password recovery and account lockout automation are out of scope for this feature
  version.
- Existing JWT infrastructure from the backend can be reused for issued client tokens.
- Session lifecycle uses access token only for this increment; refresh token support is
  deferred.
