# Implementation Plan: Refactor Backend API for Conveyor System

**Branch**: `001-refactor-backend-api` | **Date**: 2026-03-31 | **Spec**: /home/yesman/Documentos/IOT/tickets/practica-tickets/specs/001-refactor-backend-api/spec.md
**Input**: Feature specification from `/specs/001-refactor-backend-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Refactor the current monolithic Express + Socket.IO implementation into a layered
backend API with standardized REST contracts, versioned realtime contracts, JWT + RBAC,
PostgreSQL migration discipline, Docker-ready operation, and Swagger-aligned
documentation. Delivery will follow a strangler migration by domain to preserve
operational continuity while incrementally replacing legacy routes/events.

## Technical Context

**Language/Version**: Node.js 20 LTS (CommonJS in current codebase; migration-ready to modular layering)  
**Primary Dependencies**: express, socket.io, pg, dotenv, jsonwebtoken, bcryptjs, swagger-ui-express/swagger-jsdoc (or NestJS Swagger equivalent), zod/joi for validation  
**Storage**: PostgreSQL (source of truth), in-memory transient queues only for runtime state projection  
**Testing**: Jest + Supertest (REST), socket.io-client based integration tests (realtime), focused unit tests for services/guards  
**Target Platform**: Linux containers (Docker) with local docker compose execution
**Project Type**: web-service backend with realtime channel  
**Performance Goals**: SC-001 and SC-003/SC-006 from spec: 95% operational REST responses <2s; 99% state events <1s; 99.9% critical event ack within retry budget  
**Constraints**: Strangler migration with temporary coexistence; explicit versioning (`/api/v1`, `*.v1`); no mandatory idempotency key contract; JWT + RBAC (`admin`, `supervisor`, `operator`)  
**Scale/Scope**: Single conveyor backend service, domain modules for product models/checkpoints/monitors/auth, realtime dashboards and operator clients

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Phase 0 Gate Review:
- PASS: Domain architecture boundaries are explicit and mapped to `src/api`,
  `src/application`, `src/domain`, `src/infrastructure`.
- PASS: Socket.IO contracts are versioned (`*.v1`) with critical vs informative
  delivery semantics, runtime payload validation, and migration windows.
- PASS: JWT and RBAC model is defined with three roles and private-by-default write
  operations.
- PASS: PostgreSQL remains authoritative with migration artifacts and audit fields.
- PASS: Docker runtime, health checks, structured logging, and Swagger sync are in
  scope.

Post-Phase 1 Design Re-check:
- PASS: Design artifacts include OpenAPI contract and websocket contract references.
- PASS: Data model includes auditable actor context and lifecycle states.
- PASS: Quickstart validates Docker flow, API docs, and realtime smoke checks.
- PASS: Deprecation policy defines measurable coexistence and removal gates.
- PASS: No constitution violations identified; complexity justification not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-refactor-backend-api/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app.js
db/
models/
server/
sockets/

src/
├── api/
│   ├── http/
│   │   └── v1/
│   │       ├── controllers/
│   │       ├── routes/
│   │       └── middlewares/
│   └── socket/
│       └── v1/
│           ├── events/
│           ├── handlers/
│           └── gateways/
├── application/
│   ├── services/
│   ├── use-cases/
│   └── dto/
├── domain/
│   ├── entities/
│   ├── policies/
│   └── ports/
├── infrastructure/
│   ├── config/
│   ├── db/
│   │   ├── repositories/
│   │   └── migrations/
│   ├── auth/
│   ├── logging/
│   └── observability/
└── shared/
  ├── errors/
  ├── validators/
  └── contracts/

tests/
├── unit/
├── integration/
└── contract/
```

**Structure Decision**: Keep legacy directories (`server/`, `sockets/`, `models/`,
`db/`) operational during migration, and introduce a new layered `src/` tree as the
target architecture. Routing and event ownership move domain-by-domain until legacy
entry points are fully deprecated.

## Complexity Tracking

No constitution violations requiring justification.
