# Implementation Plan: Procesamiento Orientado a Pedidos

**Branch**: `003-order-processing-refactor` | **Date**: 2026-04-04 | **Spec**: /home/yesman/Documentos/IOT/tickets/practica-tickets/specs/003-order-processing-refactor/spec.md
**Input**: Feature specification from `/specs/003-order-processing-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Refactorizar el backend para operar por pedidos completos (`pedidos` y
`lineas_pedido`) en lugar de productos individuales, con progreso incremental por
linea, control de concurrencia, transiciones automaticas de estado de pedido,
consultas por cliente/detalle, y contratos realtime para integracion operativa.

## Technical Context

**Language/Version**: Node.js 20 LTS (CommonJS)  
**Primary Dependencies**: express, socket.io, pg, zod, jsonwebtoken, swagger-jsdoc/swagger-ui-express  
**Storage**: PostgreSQL (tablas `pedidos`, `lineas_pedido`, auditoria de estado)  
**Testing**: Jest + Supertest + socket.io-client (unit, contract, integration)  
**Target Platform**: Linux containers via Docker
**Project Type**: backend web-service with realtime channel  
**Performance Goals**: SC-001 y SC-002: p95 creacion <2s, consultas <1s  
**Constraints**: JWT obligatorio en endpoints de pedidos, ack+retry para eventos criticos, `CANCELADO` terminal prioritario, actualizacion incremental con control de concurrencia  
**Scale/Scope**: Dominio pedidos para operaciones actuales; hasta 20 lineas por pedido en esta iteracion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Phase 0 Gate Review:
- PASS: Se mantiene separacion controller/service/repository en `src/api`, `src/application`, `src/infrastructure`.
- PASS: Contratos Socket.IO versionados para pedidos seran documentados en `contracts/websocket-orders.md`.
- PASS: JWT definido para rutas/eventos de pedidos segun especificacion de seguridad.
- PASS: Impacto PostgreSQL acotado mediante nueva migracion versionada para `pedidos` y `lineas_pedido`.
- PASS: Operabilidad contemplada con Docker, healthcheck y actualizacion de OpenAPI.

Post-Phase 1 Design Re-check:
- PASS: Modelo de datos define entidades, relaciones y reglas de transicion para pedidos y lineas.
- PASS: Contratos REST/realtime documentan payloads, errores y semantica ack/retry.
- PASS: Quickstart define validaciones locales y docker para flujo crear-consultar-actualizar pedido.
- PASS: No se detectan violaciones de constitucion sin justificar.

## Project Structure

### Documentation (this feature)

```text
specs/003-order-processing-refactor/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)
```text
src/
├── api/
│   ├── http/v1/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   └── routes/
│   └── socket/v1/
│       ├── events/
│       ├── gateways/
│       └── handlers/
├── application/
│   ├── dto/
│   ├── services/
│   └── use-cases/
├── domain/
│   ├── entities/
│   └── policies/
├── infrastructure/
│   ├── auth/
│   ├── config/
│   ├── db/
│   │   ├── migrations/
│   │   └── repositories/
│   └── logging/
└── shared/
  ├── contracts/
  └── errors/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: Se conserva la arquitectura por capas existente en `src/` y
se agrega el dominio `pedidos` como slice vertical (controllers + services +
repositories + contracts), manteniendo compatibilidad con flujos previos mientras
se migra la logica de producto unitario a pedido agregado.

## Complexity Tracking

No constitution violations requiring justification.
