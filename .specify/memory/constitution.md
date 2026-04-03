<!--
Sync Impact Report
- Version change: N/A (template) -> 1.0.0
- Modified principles:
	- [PRINCIPLE_1_NAME] -> I. Backend Domain-Centric Architecture
	- [PRINCIPLE_2_NAME] -> II. Realtime Events as Public Contracts
	- [PRINCIPLE_3_NAME] -> III. Security by Default (NON-NEGOTIABLE)
	- [PRINCIPLE_4_NAME] -> IV. PostgreSQL Reliability and Traceability
	- [PRINCIPLE_5_NAME] -> V. Operability, Delivery, and API Discoverability
- Added sections:
	- Technology and Security Constraints
	- Development Workflow and Quality Gates
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (directory not present in repository)
- Follow-up TODOs:
	- None
-->

# Conveyor Backend Constitution

## Core Principles

### I. Backend Domain-Centric Architecture
All backend features MUST be implemented as explicit domain modules (for example:
products, conveyors, tickets, auth, telemetry) with clear controller/service/repository
boundaries. Business rules MUST live in services, persistence logic MUST live in
repositories, and transport layers (HTTP/WebSocket) MUST remain thin.
Rationale: Strict boundaries reduce coupling and make conveyor business logic reusable,
testable, and safe to evolve.

### II. Realtime Events as Public Contracts
All Socket.IO events MUST be versioned, documented, and validated at runtime. Event
names, payload schemas, and acknowledgment/error semantics MUST be treated as stable
contracts and reflected in API documentation. Breaking changes to event contracts MUST
follow an explicit migration path.
Rationale: Conveyor operations depend on realtime consistency between operators,
dashboards, and automated stations.

### III. Security by Default (NON-NEGOTIABLE)
Every API and realtime channel MUST enforce JWT-based authentication and role-based
authorization unless explicitly declared public in the specification. Sensitive
operations MUST log security-relevant metadata. Secrets MUST NOT be hardcoded and MUST
be provided via environment configuration.
Rationale: Conveyor control and product-tracking systems are operationally critical and
require strong access control to prevent unsafe actions.

### IV. PostgreSQL Reliability and Traceability
Persistent state MUST be stored in PostgreSQL with schema migrations under version
control. Every write path MUST preserve auditability for product and conveyor actions
(who, what, when). Data access MUST use parameterized queries or ORM protections to
prevent injection vulnerabilities.
Rationale: Product flow and ticket history require durable, queryable, and auditable
records.

### V. Operability, Delivery, and API Discoverability
Services MUST be deployable through Docker with environment parity across local,
staging, and production environments. Health checks, structured logs, and failure
paths MUST be observable. HTTP APIs MUST be documented with Swagger/OpenAPI and kept in
sync with implementation.
Rationale: Reliable operations and fast onboarding depend on repeatable deployment and
up-to-date technical documentation.

## Technology and Security Constraints

- The backend runtime MUST be Node.js using Express or NestJS.
- Realtime communication MUST use Socket.IO over authenticated channels.
- Authentication MUST use JWT with expiration and token validation on each protected
	request/event.
- The primary database MUST be PostgreSQL; local file databases are allowed only for
	mocks and test fixtures.
- Deployment artifacts MUST include Dockerfile and a compose-based local execution path.
- API documentation MUST be published from source-of-truth Swagger/OpenAPI definitions.

## Development Workflow and Quality Gates

Every feature spec, plan, and tasks set MUST include explicit checks for architecture,
security, realtime contract integrity, database migration impact, and API docs updates.

Minimum pull request gates:
- Unit tests for domain services and auth guards MUST pass.
- Integration tests for critical HTTP and Socket.IO flows MUST pass.
- Migration scripts and rollback notes MUST be reviewed for PostgreSQL changes.
- Swagger/OpenAPI and Socket.IO event docs MUST be updated when contracts change.
- Docker build and container startup checks MUST pass before merge.

## Governance

This constitution overrides conflicting local conventions for backend development.
Amendments require: (1) a written proposal, (2) impact analysis on specs/plans/tasks
templates, (3) approval by maintainers responsible for backend architecture and
operations, and (4) migration notes when changes alter existing delivery rules.

Versioning policy:
- MAJOR: Removing or redefining a core principle in a backward-incompatible way.
- MINOR: Adding a new principle/section or materially expanding mandatory controls.
- PATCH: Clarifications, wording improvements, and non-semantic refinements.

Compliance review expectations:
- Every `/speckit.plan` output MUST include a Constitution Check mapping to all five
	principles.
- Every `/speckit.tasks` output MUST include concrete tasks for tests, security,
	documentation, and Docker readiness when impacted.
- Reviewers MUST block merges that violate non-negotiable security requirements.

**Version**: 1.0.0 | **Ratified**: 2026-03-31 | **Last Amended**: 2026-03-31
