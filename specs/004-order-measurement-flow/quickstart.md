# Quickstart: Flujo de Procesamiento y Medicion de Pedidos

## 1. Prerequisites
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL disponible

Execution checklist:
- [ ] Variables de entorno cargadas (JWT_*, DATABASE_URL o PG*)
- [ ] Migraciones ejecutadas (000, 001, 002, 003, nueva migracion de medicion)
- [ ] API v1 activa (ENABLE_V1_API=true)
- [ ] Token JWT valido

## 2. Environment
1. Configurar .env con credenciales de DB y JWT.
2. Mantener AUTO_MIGRATE=true en local para aplicar migraciones al arranque.

## 3. Install and Run
```bash
npm install
npm run dev
```

Container mode:
```bash
docker compose up --build
```

Container healthcheck validation:
```bash
curl -i http://localhost:1200/api/v1/health
```
Expected:
- HTTP `200 OK`
- Body indicates API availability

## 4. Apply Migrations
```bash
npm run migrate
```

## 5. Start Measurement Process
```bash
curl -X POST http://localhost:1200/api/v1/orders/<orderId>/measurement-processes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lineaPedidoId": 12,
    "observacion": "inicio manual de proceso"
  }'
```
Expected:
- Proceso creado en estado ESPERANDO.
- Historial con entrada inicial ESPERANDO.

## 6. Transition Process State
```bash
curl -X POST http://localhost:1200/api/v1/measurement-processes/<processId>/state \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "EN_PROCESO",
    "observacion": "proceso en linea"
  }'
```
Expected:
- Estado actual EN_PROCESO.
- iniciado_en registrado.

## 7. Register Measurement
```bash
curl -X POST http://localhost:1200/api/v1/measurement-processes/<processId>/measurements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "modeloProductoId": 5,
    "idempotencyKey": "station-1-run-42-sample-001",
    "qrOk": true,
    "pesoOk": true,
    "colorOk": true,
    "alturaOk": true
  }'
```
Expected:
- Medicion registrada como APROBADA.
- Progreso de linea/pedido incrementado automaticamente.
- Reintento con mismo idempotencyKey no vuelve a incrementar contadores.

## 8. Query Process Detail
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:1200/api/v1/measurement-processes/<processId>"
```
Expected:
- Retorna proceso, historial de estados y mediciones asociadas.

## 9. Realtime Validation
- Conectar a /realtime/v1 con JWT.
- Verificar eventos:
  - measurement.process.started.v1
  - measurement.process.state.changed.v1
  - measurement.recorded.v1
  - measurement.progress.applied.v1

## 10. Tests
```bash
npm test
```
Expected coverage for this feature:
- Unit: maquina de estados, regla de resultado, idempotencia y bloqueo de progreso manual.
- Contract: endpoints de proceso/medicion + eventos websocket.
- Integration: flujo completo proceso -> medicion -> progreso aplicado.

Measurement-focused suite:
```bash
npm run test:measurement
```

Recorded outcome (2026-04-19):
- Test Suites: 11 passed, 11 total
- Tests: 32 passed, 32 total

## 11. Measurement Smoke Checklist
- [ ] API responde healthcheck en contenedor (200 OK)
- [ ] Se puede crear proceso con `lineaPedidoId`
- [ ] Se puede crear proceso sin `lineaPedidoId`
- [ ] Transicion valida ESPERANDO -> EN_PROCESO persiste en historial
- [ ] Registro de medicion aprobada aplica progreso
- [ ] Reintento con misma `idempotencyKey` no duplica progreso
- [ ] `idempotencyKey` malformada retorna 400 y no persiste
- [ ] Eventos realtime esperados son emitidos y ackeados

## 12. Operational Validation Notes
- Docker Compose config validated with:
```bash
docker compose config --quiet
```
- Migration flow validated by including `004_measurement_flow.sql` in bootstrap migration runner and confirming test suite compatibility.
