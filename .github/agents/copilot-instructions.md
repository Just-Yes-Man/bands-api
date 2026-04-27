# practica-tickets Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-16

## Active Technologies
- Node.js 20 LTS (CommonJS) + express, socket.io, pg, bcryptjs, jsonwebtoken, zod, swagger-jsdoc/swagger-ui-express (002-cliente-auth)
- PostgreSQL (`clientes` as primary auth identity source) (002-cliente-auth)
- Node.js 20 LTS (CommonJS) + express, socket.io, pg, zod, jsonwebtoken, swagger-jsdoc/swagger-ui-express (003-order-processing-refactor)
- PostgreSQL (tablas `pedidos`, `lineas_pedido`, auditoria de estado) (003-order-processing-refactor)
- PostgreSQL (tablas `procesos_medicion`, `historial_estados_proceso`, `mediciones` + `pedidos` y `lineas_pedido`) (004-order-measurement-flow)

- Node.js 20 LTS (CommonJS in current codebase; migration-ready to modular layering) + express, socket.io, pg, dotenv, jsonwebtoken, bcryptjs, swagger-ui-express/swagger-jsdoc (or NestJS Swagger equivalent), zod/joi for validation (001-refactor-backend-api)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

# Add commands for Node.js 20 LTS (CommonJS in current codebase; migration-ready to modular layering)

## Code Style

Node.js 20 LTS (CommonJS in current codebase; migration-ready to modular layering): Follow standard conventions

## Recent Changes
- 004-order-measurement-flow: Added Node.js 20 LTS (CommonJS) + express, socket.io, pg, zod, jsonwebtoken, swagger-jsdoc/swagger-ui-express
- 003-order-processing-refactor: Added Node.js 20 LTS (CommonJS) + express, socket.io, pg, zod, jsonwebtoken, swagger-jsdoc/swagger-ui-express
- 002-cliente-auth: Added Node.js 20 LTS (CommonJS) + express, socket.io, pg, bcryptjs, jsonwebtoken, zod, swagger-jsdoc/swagger-ui-express


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
