# practica-tickets Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-04

## Active Technologies
- Node.js 20 LTS (CommonJS) + express, socket.io, pg, bcryptjs, jsonwebtoken, zod, swagger-jsdoc/swagger-ui-express (002-cliente-auth)
- PostgreSQL (`clientes` as primary auth identity source) (002-cliente-auth)
- Node.js 20 LTS (CommonJS) + express, socket.io, pg, zod, jsonwebtoken, swagger-jsdoc/swagger-ui-express (003-order-processing-refactor)
- PostgreSQL (tablas `pedidos`, `lineas_pedido`, auditoria de estado) (003-order-processing-refactor)

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
- 003-order-processing-refactor: Added Node.js 20 LTS (CommonJS) + express, socket.io, pg, zod, jsonwebtoken, swagger-jsdoc/swagger-ui-express
- 002-cliente-auth: Added Node.js 20 LTS (CommonJS) + express, socket.io, pg, bcryptjs, jsonwebtoken, zod, swagger-jsdoc/swagger-ui-express

- 001-refactor-backend-api: Added Node.js 20 LTS (CommonJS in current codebase; migration-ready to modular layering) + express, socket.io, pg, dotenv, jsonwebtoken, bcryptjs, swagger-ui-express/swagger-jsdoc (or NestJS Swagger equivalent), zod/joi for validation

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
