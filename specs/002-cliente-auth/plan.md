# Implementation Plan: Registro y Login de Clientes

**Branch**: `002-cliente-auth` | **Date**: 2026-04-01 | **Spec**: /home/yesman/Documentos/IOT/tickets/practica-tickets/specs/002-cliente-auth/spec.md
**Input**: Feature specification from `/specs/002-cliente-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement client registration and login over the existing `clientes` table with
access-token-only JWT sessions (1 hour), password policy enforcement, login rate
limiting, non-disclosing auth errors, and integration with protected REST/WebSocket
channels. The feature must preserve existing system behavior and fit the current
Docker + PostgreSQL runtime.

## Technical Context

**Language/Version**: Node.js 20 LTS (CommonJS)  
**Primary Dependencies**: express, socket.io, pg, bcryptjs, jsonwebtoken, zod, swagger-jsdoc/swagger-ui-express  
**Storage**: PostgreSQL (`clientes` as primary auth identity source)  
**Testing**: Jest + Supertest + socket.io-client contract/integration suites  
**Target Platform**: Linux containers via Docker
**Project Type**: backend web-service with realtime channel  
**Performance Goals**: SC-001/SC-002: p95 register/login <2s under normal load  
**Constraints**: Access-token-only JWT (1h expiry), minimum password policy (8 chars + 1 number), rate-limit by IP/user, generic login failure message, no refresh-token flow  
**Scale/Scope**: Client auth domain only; no password recovery/SSO in this increment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Phase 0 Gate Review:
- PASS: Auth feature is mapped to layered boundaries (`api` -> `application` ->
  `domain` -> `infrastructure`).
- PASS: Realtime protected access remains JWT-gated and contract-aware.
- PASS: Security decisions are explicit: access-token-only JWT, password policy,
  rate-limit, and generic failure messaging.
- PASS: PostgreSQL impact is bounded to `clientes` usage and optional migration for
  uniqueness/audit support.
- PASS: Docker and API documentation updates are included in scope.

Post-Phase 1 Design Re-check:
- PASS: Data model defines account/session/audit entities and validation rules.
- PASS: REST contracts include register/login and protected behavior.
- PASS: Quickstart includes auth flow verification in local + Docker execution.
- PASS: No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/002-cliente-auth/
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
│   ├── http/v1/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── middlewares/
│   └── socket/v1/
│       ├── gateways/
│       ├── handlers/
│       └── middlewares/
├── application/
│   ├── services/
│   ├── use-cases/
│   └── dto/
├── domain/
│   ├── entities/
│   └── policies/
├── infrastructure/
│   ├── config/
│   ├── db/
│   │   ├── migrations/
│   │   └── repositories/
│   ├── auth/
│   └── logging/
└── shared/
    ├── errors/
    └── contracts/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Keep legacy modules operational while adding auth capability
through the new layered `src/` architecture. Client auth is introduced as a new domain
slice and then referenced by protected REST and websocket paths.

## Complexity Tracking

No constitution violations requiring justification.
