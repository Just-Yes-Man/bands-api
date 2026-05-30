# Research: Flujo de Procesamiento y Medicion de Pedidos

## Decision 1: Maquina de estados de proceso de medicion
- Decision: Adoptar flujo cerrado `ESPERANDO -> EN_PROCESO -> COMPLETADO/FALLIDO`, con `CANCELADO` permitido solo desde `ESPERANDO` o `EN_PROCESO`.
- Rationale: Proporciona trazabilidad operativa y evita estados ambiguos o regresiones invalidas.
- Alternatives considered:
  - Flujo minimo sin FALLIDO/CANCELADO: rechazado por baja capacidad de auditoria.
  - Flujo libre sin validacion estricta: rechazado por inconsistencias en negocio.

## Decision 2: Regla de resultado de medicion
- Decision: Regla estricta: `APROBADA` solo con `qr_ok`, `peso_ok`, `color_ok`, `altura_ok` en `true`; `RECHAZADA` si cualquiera es `false`; `PENDIENTE` si falta alguna verificacion.
- Rationale: Preserva criterio de calidad deterministico y auditable.
- Alternatives considered:
  - Mayorias o umbrales flexibles: rechazados por ambiguedad operativa.

## Decision 3: Idempotencia estricta para reintentos
- Decision: Aplicar idempotencia por clave de negocio de medicion y rechazar duplicados sin volver a impactar progreso.
- Rationale: Evita sobreconteo por reintentos de origen o retransmisiones de red.
- Rule details:
  - Formato minimo: `<origen>-<proceso>-<muestra>`.
  - Longitud maxima: 120 caracteres.
  - Alcance de unicidad: por `proceso_medicion_id`.
- Alternatives considered:
  - Reprocesar todos los eventos: rechazado por riesgo de inflar progreso.
  - Reemplazo de medicion previa: rechazado por complejidad y recalculo regresivo.

## Decision 4: Convivencia con progreso manual
- Decision: Bloquear progreso manual de linea cuando exista proceso de medicion activo en esa linea.
- Rationale: Elimina conflicto de fuentes de verdad durante procesamiento en curso.
- Alternatives considered:
  - Permitir ambas fuentes siempre: rechazada por condiciones de carrera.
  - Prioridad fija entre fuentes: rechazada por complejidad y baja trazabilidad.

## Decision 5: Seguridad del flujo
- Decision: Requerir JWT en endpoints/canales de medicion con matriz explicita de roles (`admin`, `supervisor`, `operator`, `client`) y ownership de cliente en consultas.
- Rationale: Alinea constitucion de autorizacion por rol sin endurecer mas alla del alcance funcional acordado para esta iteracion.
- Alternatives considered:
  - Endpoints publicos: rechazado por riesgo operacional.
  - Restricciones por rol estrictas en v1: diferidas para fase de hardening.

## Decision 6: Contratos realtime del dominio de medicion
- Decision: Emitir eventos versionados `.v1` para proceso iniciado, cambio de estado, medicion registrada y progreso aplicado.
- Rationale: Permite sincronizacion con clientes en tiempo real y evolucion controlada de contratos.
- Alternatives considered:
  - Sin eventos realtime: rechazado por visibilidad operativa insuficiente.

## Decision 7: Estrategia de migracion PostgreSQL
- Decision: Agregar migracion versionada para `procesos_medicion`, `historial_estados_proceso`, `mediciones` e indices; tratar `monitores_proceso` como estructura existente y ajustar mediante guards idempotentes (sin recreacion destructiva) cuando falten constraints o indices esperados.
- Rationale: Evita duplicidad de tablas ya presentes y mantiene despliegue reproducible.
- Alternatives considered:
  - Re-crear `monitores_proceso` sin chequeos: rechazado por riesgo de colision en entornos existentes.

## Decision 8: Operacion en Docker y evidencia
- Decision: Mantener `AUTO_MIGRATE` para entorno local/contenedor y documentar smoke flow de medicion en quickstart.
- Rationale: Reduce pasos manuales y facilita validacion continua en CI/local.
- Alternatives considered:
  - Migraciones manuales como flujo principal: rechazado por mayor friccion operativa.

## Migration Rollback Notes
- En entornos no productivos, revertir en orden:
  - `mediciones`
  - `historial_estados_proceso`
  - `procesos_medicion`
- Conservar datos historicos en productivo; preferir rollback logico via feature flags y bloqueo de nuevos procesos sobre drop fisico.
