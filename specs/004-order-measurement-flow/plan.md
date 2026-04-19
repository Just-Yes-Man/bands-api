# Implementation Plan: Flujo de Procesamiento y Medicion de Pedidos

**Branch**: `004-order-measurement-flow` | **Date**: 2026-04-16 | **Spec**: /home/yesman/Documentos/IOT/tickets/practica-tickets/specs/004-order-measurement-flow/spec.md
**Input**: Feature specification from `/specs/004-order-measurement-flow/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Extender el dominio de pedidos para incorporar procesos de medicion trazables,
registro de mediciones por proceso, actualizacion automatica de progreso de lineas
y pedido, idempotencia estricta para reintentos, y bloqueo de progreso manual
mientras exista proceso activo en la linea.

## Technical Context

**Language/Version**: Node.js 20 LTS (CommonJS)  
**Primary Dependencies**: express, socket.io, pg, zod, jsonwebtoken, swagger-jsdoc/swagger-ui-express  
**Storage**: PostgreSQL (tablas `procesos_medicion`, `historial_estados_proceso`, `mediciones` + `pedidos` y `lineas_pedido`)  
**Testing**: Jest + Supertest + socket.io-client (unit, contract, integration)  
**Target Platform**: Linux containers via Docker
**Project Type**: backend web-service with realtime channel  
**Performance Goals**: SC-001 y SC-002: inicio proceso p95 <2s y aplicacion de medicion a progreso p95 <1s  
**Constraints**: JWT obligatorio en endpoints/eventos con matriz explicita de roles y ownership de cliente en consultas, idempotencia estricta, maquina de estados cerrada de proceso, exclusividad de progreso manual cuando proceso activo  
**Scale/Scope**: Flujo de medicion por pedido/linea en backend v1, orientado a operacion de planta con multiples procesos por pedido

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Phase 0 Gate Review:
- PASS: Limites por capas definidos; se conserva separacion controller/service/repository en `src/api`, `src/application`, `src/infrastructure`.
- PASS: Contratos Socket.IO para medicion identificados y versionados con sufijo `.v1`.
- PASS: Modelo de seguridad definido: JWT requerido + matriz de roles explicita + ownership de cliente en rutas/canales de medicion.
- PASS: Impacto PostgreSQL identificado mediante nueva migracion versionada y trazabilidad de estados/mediciones.
- PASS: Operabilidad contemplada en Docker, healthcheck y actualizacion OpenAPI.

Post-Phase 1 Design Re-check:
- PASS: Modelo de datos define entidades, relaciones y restricciones de integridad/idempotencia.
- PASS: Contratos REST/realtime documentan payloads, estados y politica de errores.
- PASS: Quickstart cubre ejecucion local y Docker con validaciones end-to-end.
- PASS: No se detectan violaciones no justificadas de la constitucion.

## Project Structure

### Documentation (this feature)

```text
specs/004-order-measurement-flow/
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

**Structure Decision**: Se mantiene la arquitectura backend existente en capas y
se agrega el slice de medicion de procesos como extension vertical del dominio de
pedidos, reutilizando infraestructura de auth, postgres, realtime y swagger.

## Complexity Tracking

No constitution violations requiring justification.
