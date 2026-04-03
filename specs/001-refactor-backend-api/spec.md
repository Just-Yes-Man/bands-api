# Feature Specification: Refactor Backend API for Conveyor System

**Feature Branch**: `001-refactor-backend-api`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description: "Analiza mi implementacion actual de un sistema de bandas transportadoras y refactorizala para convertirla en una API backend completa. Elimina codigo innecesario, mejora la organizacion, separa la logica en capas estandariza endpoints REST, y mejora el manejo de WebSockets."

## Clarifications

### Session 2026-03-31

- Q: What RBAC role model should be used for protected endpoints and realtime channels? -> A: Option B (3 roles: admin, supervisor, operator)
- Q: What websocket delivery guarantee should be used? -> A: Option B (ack + retry only for critical events; informative events best-effort)
- Q: What migration strategy should be used for refactoring rollout? -> A: Option B (strangler by domain with temporary coexistence)
- Q: What contract versioning strategy should be used for REST and WebSocket? -> A: Option B (major version in REST path and event names, e.g., /api/v1 and *.v1)
- Q: Should idempotency be mandatory for write operations? -> A: Option A (no explicit idempotency; client-driven retry responsibility)

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

### User Story 1 - Operar Flujo de Productos por API Estandarizada (Priority: P1)

Como operador o sistema integrador, quiero gestionar modelos de producto y registrar
pasos de inspeccion mediante endpoints REST consistentes para controlar el flujo de la
banda sin depender de logica de interfaz web.

**Why this priority**: Es el minimo producto viable del refactor, porque permite
mantener la operacion del negocio con una interfaz backend estable y desacoplada.

**Independent Test**: Puede validarse ejecutando llamadas HTTP sobre los endpoints
principales de modelos y pasos, verificando respuestas consistentes y persistencia
correcta de datos.

**Acceptance Scenarios**:

1. **Given** que existe al menos un monitor activo, **When** se registra un paso de
  producto con datos validos, **Then** el sistema guarda el evento y responde con un
  resultado de negocio claro (exito o rechazo con motivo).
2. **Given** que un cliente consulta modelos de producto, **When** solicita crear o
  consultar modelos por identificador funcional, **Then** recibe una respuesta
  estructurada y uniforme para todos los endpoints de la API.

---

### User Story 2 - Monitoreo en Tiempo Real Confiable (Priority: P2)

Como supervisor de linea, quiero recibir actualizaciones en tiempo real de pasos
pendientes y ultimas revisiones mediante eventos WebSocket bien definidos para tomar
decisiones operativas sin retrasos ni inconsistencias.

**Why this priority**: El valor operativo del sistema depende de la visibilidad en
tiempo real; sin ello, la API pierde capacidad de soporte a monitoreo y reaccion.

**Independent Test**: Puede validarse conectando uno o mas clientes WebSocket y
confirmando emision de eventos esperados ante cambios de estado.

**Acceptance Scenarios**:

1. **Given** que hay clientes conectados al canal en tiempo real, **When** se registra
  un nuevo paso de producto, **Then** todos los clientes autorizados reciben eventos
  actualizados con formato consistente.
2. **Given** que un cliente se conecta por primera vez, **When** completa la conexion,
  **Then** recibe un estado inicial coherente sin necesidad de refrescos manuales.

---

### User Story 3 - Backend Mantenible y Seguro por Capas (Priority: P3)

Como equipo de desarrollo, queremos una arquitectura por capas (transporte,
aplicacion, dominio, persistencia) con responsabilidades claras para acelerar cambios
futuros, reducir errores y aplicar seguridad de forma consistente.

**Why this priority**: Mejora la sostenibilidad del producto y reduce costos de cambio,
pero depende de que el flujo funcional y realtime minimo ya este estable.

**Independent Test**: Puede validarse revisando trazabilidad de cada flujo entre capas,
ejecucion de pruebas de servicios/controladores y ausencia de duplicidad de reglas.

**Acceptance Scenarios**:

1. **Given** una nueva regla de validacion de negocio, **When** se implementa,
   **Then** se modifica en una sola capa de negocio y se refleja de forma consistente
   en REST y WebSocket.
2. **Given** un endpoint protegido, **When** se consume sin credenciales validas,
   **Then** el sistema rechaza el acceso de forma uniforme y auditable.

---

### Edge Cases

- Registro de paso con datos incompletos o fuera de rango operacional (peso, altura,
  color o QR invalido).
- Desconexion y reconexion de clientes WebSocket durante actividad intensa de eventos.
- Falta temporal de conectividad con base de datos durante una operacion de escritura.
- Solicitudes concurrentes para el mismo producto o paso en intervalos cortos.
- Token expirado o invalido en endpoints y eventos protegidos.
- Reintentos de cliente que pueden generar solicitudes de escritura duplicadas en
  ausencia de una clave de idempotencia obligatoria.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a REST API for conveyor operations with consistent
  resource naming, response structure, and error semantics across all endpoints.
- **FR-001A**: The system MUST use explicit major versioning in REST route prefixes
  (for example `/api/v1`) to support controlled evolution.
- **FR-002**: The system MUST separate responsibilities into clear layers so that
  transport concerns, business rules, and data access are independently maintainable.
- **FR-003**: Users MUST be able to create and query product model definitions required
  to evaluate conveyor checkpoints.
- **FR-004**: The system MUST register product checkpoint events and persist them with
  sufficient detail to support traceability and historical analysis.
- **FR-005**: The system MUST provide structured operational and security event logs for
  critical actions and failures.
- **FR-006**: The system MUST support an incremental domain-by-domain migration where
  legacy and refactored interfaces can coexist temporarily without breaking core
  conveyor operations.
- **FR-007**: The system MUST not require a mandatory idempotency key at API contract
  level; duplicate-write risk handling remains a client retry and business-validation
  responsibility.

Backend constitution coverage (mandatory when applicable):

- **FR-SEC-001**: The system MUST require valid JWT credentials for all write
  operations and all realtime channels except explicitly designated public endpoints.
- **FR-SEC-002**: The system MUST apply role-based authorization for administrative
  operations using three roles: `admin`, `supervisor`, and `operator`.
- **FR-SEC-003**: The system MUST enforce role permissions as follows: `admin` can
  manage master data and configuration, `supervisor` can monitor and execute
  supervisory operational actions, and `operator` can execute assigned operational
  flow actions without configuration privileges.
- **FR-RT-001**: The system MUST publish websocket events with documented event names,
  payload fields, and acknowledgment behavior.
- **FR-RT-001A**: The system MUST version websocket event names with explicit major
  version suffixes (for example `event-name.v1`) and preserve compatibility during
  declared deprecation windows.
- **FR-RT-002**: The system MUST deliver an initial state snapshot to newly connected
  authorized realtime clients.
- **FR-RT-003**: The system MUST require acknowledgment with bounded retries for
  critical operational events, while non-critical informative events may use
  best-effort delivery.
- **FR-RT-004**: The system MUST validate websocket payload schemas at runtime for all
  client-to-server command events and reject invalid payloads with contract-defined
  validation errors.
- **FR-DATA-001**: The system MUST manage relational schema evolution through versioned
  migration artifacts and rollback guidance.
- **FR-DATA-002**: The system MUST keep auditable records of who performed protected
  actions and when they occurred.
- **FR-OPS-001**: The backend MUST be runnable through containerized environments with
  environment-driven configuration.
- **FR-OPS-002**: The backend MUST expose health status that allows operators to detect
  startup and runtime readiness.
- **FR-OPS-003**: The system MUST provide a controlled deprecation path for legacy
  endpoints/events, including compatibility windows and removal criteria.
- **FR-OPS-004**: The deprecation policy MUST define a minimum 30-day coexistence
  window and objective removal gates: less than 5% legacy traffic for 7 consecutive
  days and no P1/P2 incidents linked to v1 contracts during that period.
- **FR-DOC-001**: The system MUST keep API documentation aligned with current REST
  behavior and protected/public endpoint definitions.
- **FR-DOC-002**: The system MUST include documented websocket contract references for
  all realtime events used by clients.

### Key Entities *(include if feature involves data)*

- **Product Model**: Defines expected product characteristics used in conveyor
  verification (functional identifier, expected physical attributes, active status).
- **Product Checkpoint Event**: Represents each inspected movement of a product through
  the conveyor process (product reference, observed metrics, decision outcome,
  timestamp, source channel/monitor).
- **Process Monitor**: Represents active monitoring points in the conveyor flow that
  generate or consume operational state.
- **Operator Identity**: Represents authenticated actor context used for authorization
  and audit trails of protected actions, including role (`admin`, `supervisor`,
  `operator`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of successful operational requests return a valid business response in
  under 2 seconds during normal load.
- **SC-002**: 100% of protected operations are rejected when credentials are missing,
  invalid, or unauthorized according to defined roles.
- **SC-003**: At least 99% of state-changing conveyor events are reflected in connected
  realtime clients within 1 second of acceptance.
- **SC-006**: At least 99.9% of critical realtime events receive acknowledgment within
  configured retry limits during normal operations.
- **SC-004**: The team can onboard a new developer to execute one complete product-flow
  change request in 1 business day using only project documentation.
- **SC-005**: Production incidents linked to inconsistent response formats or duplicated
  business rules decrease by at least 50% within one release cycle after rollout.
- **SC-007**: 100% of published REST endpoints and realtime events include explicit
  major version markers aligned with documented deprecation policy.
- **SC-008**: 100% of websocket command events enforce runtime payload validation and
  return contract-compliant validation errors when payloads are invalid.
- **SC-009**: During performance verification, measured p95 REST latency remains under
  2 seconds and critical event acknowledgment success remains at or above 99.9% over a
  representative 15-minute load window.

## Assumptions

- Existing conveyor business behavior remains functionally equivalent unless explicitly
  changed by approved requirements.
- Migration will follow a strangler pattern by domain, with temporary coexistence of
  legacy and refactored contracts during controlled cutover windows.
- Frontend screens are out of scope for this feature except for compatibility impacts
  needed to consume new backend contracts.
- Existing PostgreSQL data remains the source of truth and can be migrated without
  destructive resets in standard environments.
- The organization can provide a JWT issuer/validation strategy acceptable for
  operational users and service clients.
- Basic container runtime availability is assumed in target environments for deployment
  and local verification.
