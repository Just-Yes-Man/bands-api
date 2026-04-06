# Quickstart: Procesamiento Orientado a Pedidos

## 1. Prerequisites
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL disponible

Execution checklist:
- [x] Variables de entorno cargadas (`JWT_*`, `DATABASE_URL` o `PG*`)
- [x] Migraciones ejecutadas (`001`, `002`, `003`)
- [x] API v1 activa (`ENABLE_V1_API=true`)
- [ ] Token JWT valido con rol permitido

## 2. Environment
1. Configurar `.env` con credenciales DB y JWT.
2. Mantener `AUTO_MIGRATE=true` en local para aplicar migraciones.

## 3. Install and Run
```bash
npm install
npm run dev
```

Container mode:
```bash
docker compose up --build
```

## 4. Apply Migrations
```bash
npm run migrate
```

## 5. Create Pedido
```bash
curl -X POST http://localhost:1200/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": 1,
    "lineas": [
      {"modeloProductoId": 1, "cantidad": 10},
      {"modeloProductoId": 2, "cantidad": 5}
    ]
  }'
```
Expected:
- Pedido creado en estado `PENDIENTE`.
- Lineas con `procesadas=0`, `rechazadas=0`.

## 6. Query Orders
List by client:
```bash
curl -H "Authorization: Bearer <token>" "http://localhost:1200/api/v1/orders?clienteId=1&page=1&pageSize=20"
```

Detail/progress:
```bash
curl -H "Authorization: Bearer <token>" "http://localhost:1200/api/v1/orders/<pedidoId>"
```
Expected:
- Resumen de progreso agregado y detalle de lineas.

## 7. Report Progress Incrementally
```bash
curl -X POST http://localhost:1200/api/v1/orders/<pedidoId>/lines/<lineaId>/progress \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"deltaProcesadas": 2, "deltaRechazadas": 1, "version": 3}'
```
Expected:
- Actualizacion incremental exitosa con control de concurrencia.
- Estado del pedido transiciona automaticamente cuando corresponde.

## 8. Realtime Validation
- Conectar a `/realtime/v1` con JWT.
- Verificar evento critico `order.progress.updated.v1` con ack/retry.
- Verificar evento informativo `order.summary.updated.v1` en best-effort.

## 9. Documentation Validation
- Abrir Swagger en `/api/v1/docs`.
- Confirmar endpoints de pedidos y ejemplos de respuesta/errores.

## 10. Tests
```bash
npm test
```
Expected coverage for this feature:
- Unit: reglas de estado y control de concurrencia
- Contract: endpoints orders + eventos socket
- Integration: flujo crear-consultar-actualizar-cancelar pedido

Latest validation snapshot:
- `npm test`: 28 passed, 0 failed
- Order unit subset: `tests/unit/orders/*.test.js` passed

Docker validation snapshot (2026-04-04):
- `docker compose up --build -d`: OK
- Aplicadas migraciones: `000_legacy_base.sql`, `001_init_refactor.sql`, `002_client_auth.sql`, `003_orders_domain.sql`
- `curl http://localhost:1200/api/v1/health`: `{"ok":true,...}`
