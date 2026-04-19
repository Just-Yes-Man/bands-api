# Feature Specification: Flujo de Procesamiento y Medicion de Pedidos

**Feature Branch**: `004-order-measurement-flow`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Extiende el sistema orientado a pedidos agregando el flujo de procesamiento y medicion, registrando resultados y actualizando automaticamente el progreso de lineas de pedido y pedidos, con ajustes necesarios de base de datos."

## Clarifications

### Session 2026-04-16

- Q: Como se manejan mediciones duplicadas/reintentos para evitar sobreconteo? -> A: Option A (idempotencia estricta por clave de negocio)
- Q: Como se determina resultado_final de cada medicion? -> A: Option A (aprobacion estricta por todas las verificaciones)
- Q: Que modelo de autorizacion aplica para crear procesos, cambiar estado y registrar mediciones? -> A: Option A (todos los roles autenticados del sistema pueden escribir, con matriz de roles explicita y alcance por cliente para consultas)
- Q: Cual es la maquina de estados oficial del proceso de medicion? -> A: Option B (ESPERANDO -> EN_PROCESO -> COMPLETADO/FALLIDO; CANCELADO desde ESPERANDO/EN_PROCESO)
- Q: Como se evita conflicto entre progreso manual y progreso por medicion? -> A: Option B (exclusividad por proceso activo en la linea)
- Q: Cual es el formato minimo de idempotency key para mediciones? -> A: Option A (clave normalizada tipo `<origen>-<proceso>-<muestra>`, longitud maxima 120, unicidad por proceso)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Iniciar y Trazar Procesos de Medicion (Priority: P1)

Como operador, quiero iniciar un proceso de medicion asociado a un pedido y linea para tener trazabilidad del ciclo de procesamiento desde el estado de espera hasta su finalizacion.

**Why this priority**: Sin proceso de medicion no existe el nuevo flujo operativo ni la base para registrar resultados y actualizar progreso.

**Independent Test**: Puede validarse creando un proceso de medicion para una linea activa y comprobando que se registra su estado inicial y su historial de cambios.

**Acceptance Scenarios**:

1. **Given** un pedido existente con lineas activas, **When** se inicia un proceso de medicion para una linea, **Then** el sistema crea el proceso con estado inicial ESPERANDO y registra ese estado en historial.
2. **Given** un proceso de medicion existente, **When** su estado cambia durante la ejecucion, **Then** el sistema agrega un nuevo registro en historial con marca de tiempo y observacion opcional.
3. **Given** un pedido existente sin linea objetivo definida, **When** se inicia un proceso de medicion sin `lineaPedidoId`, **Then** el sistema crea el proceso a nivel de pedido y mantiene trazabilidad equivalente.

---

### User Story 2 - Registrar Mediciones y Actualizar Progreso (Priority: P1)

Como sistema de control, quiero registrar mediciones por proceso y reflejar automaticamente su resultado en el progreso de la linea y del pedido para mantener el estado operativo en tiempo real.

**Why this priority**: Es el objetivo central del requerimiento: convertir resultados de medicion en avance real de produccion sin intervención manual.

**Independent Test**: Puede validarse registrando mediciones validas y verificando que aumentan los contadores de procesadas o rechazadas y recalculan el estado agregado del pedido.

**Acceptance Scenarios**:

1. **Given** un proceso de medicion en curso para una linea activa, **When** se registra una medicion con resultado aprobatorio, **Then** el sistema incrementa el progreso de la linea y recalcula el progreso del pedido.
2. **Given** un proceso de medicion en curso para una linea activa, **When** se registra una medicion con resultado no aprobatorio, **Then** el sistema incrementa rechazos de la linea y recalcula el pedido manteniendo consistencia de estado.

---

### User Story 3 - Consultar Estado Operativo de Procesos (Priority: P2)

Como supervisor, quiero consultar procesos de medicion y su historial para auditar por que una linea o pedido cambio de estado.

**Why this priority**: Aporta visibilidad y soporte operativo, pero depende de que el flujo de registro y actualizacion ya funcione.

**Independent Test**: Puede validarse consultando un proceso ya ejecutado y verificando trazabilidad completa de estados y mediciones asociadas.

**Acceptance Scenarios**:

1. **Given** un proceso con mediciones registradas, **When** se consulta su detalle, **Then** se muestran su estado actual, historial de estados y resultados de medicion asociados.
2. **Given** multiples procesos sobre el mismo pedido, **When** se consulta por pedido, **Then** se devuelve el conjunto de procesos con su estado actual y tiempos de inicio/fin.

---

### Edge Cases

- Registro de medicion para una linea cancelada o ya cerrada.
- Registro de medicion cuando el pedido ya esta en estado terminal no actualizable.
- Proceso de medicion referenciando una linea que no pertenece al pedido indicado.
- Doble envio de una misma medicion por reintento del origen de datos sin incrementar progreso mas de una vez.
- Registro de medicion con verificaciones incompletas que debe mantenerse en estado PENDIENTE sin impactar progreso final.
- Finalizacion de proceso sin mediciones registradas.
- Llegada de medicion tardia despues de finalizado el proceso.
- Operacion sobre procesos sin JWT valido o token expirado.
- Intento de transicion de estado no valida (por ejemplo, COMPLETADO -> EN_PROCESO).
- Intento de actualizacion manual de progreso sobre una linea con proceso de medicion activo.
- Registro de medicion con `idempotencyKey` vacio, malformado o fuera de longitud permitida.
- Consulta de procesos de otro cliente sin alcance permitido por ownership.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir crear procesos de medicion asociados a un pedido y opcionalmente a una linea de pedido, incluyendo casos sin `lineaPedidoId`.
- **FR-002**: El sistema MUST inicializar cada proceso de medicion en estado ESPERANDO y registrar ese estado en historial de estados del proceso.
- **FR-003**: El sistema MUST aplicar la maquina de estados del proceso: ESPERANDO -> EN_PROCESO -> COMPLETADO o FALLIDO, permitiendo CANCELADO desde ESPERANDO o EN_PROCESO, y conservar historial cronologico de cada cambio con observacion opcional.
- **FR-004**: El sistema MUST registrar mediciones vinculadas a un proceso y al modelo de producto correspondiente.
- **FR-005**: El sistema MUST calcular resultado final de cada medicion con regla estricta: APROBADA solo cuando qr_ok, peso_ok, color_ok y altura_ok son true; RECHAZADA cuando cualquiera sea false; PENDIENTE cuando falte al menos una verificacion.
- **FR-006**: El sistema MUST actualizar automaticamente progreso de linea cuando se registra una medicion finalizada, sin superar la cantidad solicitada de la linea.
- **FR-007**: El sistema MUST recalcular automaticamente progreso y estado agregado del pedido tras cada actualizacion de linea originada por medicion.
- **FR-008**: El sistema MUST bloquear actualizaciones de progreso por medicion para pedidos o lineas en estados no actualizables.
- **FR-009**: El sistema MUST asegurar consistencia entre pedido, linea y proceso de medicion, rechazando relaciones cruzadas invalidas.
- **FR-010**: El sistema MUST permitir consultas de procesos por pedido y consulta de detalle de proceso con historial y mediciones.
- **FR-011**: El sistema MUST registrar marca de inicio al entrar en EN_PROCESO y marca de finalizacion al entrar en COMPLETADO, FALLIDO o CANCELADO.
- **FR-012**: El sistema MUST mantener trazabilidad auditable de eventos de proceso y medicion para diagnostico operativo, persistiendo minimo `who/what/when` (actor/rol, accion y timestamp) mas `correlationId` por operacion.
- **FR-013**: El sistema MUST aplicar idempotencia estricta para mediciones repetidas; `idempotencyKey` MUST seguir formato normalizado `<origen>-<proceso>-<muestra>`, longitud maxima 120 y unicidad por proceso para impedir doble aplicacion de progreso.
- **FR-014**: El sistema MUST bloquear actualizaciones manuales de progreso sobre una linea mientras exista un proceso de medicion activo asociado a esa linea.

Backend constitution coverage (mandatory when applicable):

- **FR-SEC-001**: Endpoints y eventos del flujo de medicion MUST requerir JWT valido y autorizacion por rol explicita con matriz operativa v1: crear proceso, transicionar estado y registrar medicion permiten `admin`, `supervisor`, `operator`, `client` autenticados; listar/consultar/suscribirse permiten los mismos roles; en todos los casos `client` MUST operar solo sobre pedidos/procesos de su ownership.
- **FR-RT-001**: El flujo MUST emitir eventos realtime versionados para inicio de proceso, cambio de estado y medicion registrada, con semantica de confirmacion y error documentada.
- **FR-DATA-001**: El sistema MUST agregar y versionar migraciones para procesos_medicion, historial_estados_proceso y mediciones, con indices de consulta operativa y restricciones de integridad referencial.
- **FR-DATA-002**: La tabla de monitores de proceso MUST mantenerse consistente con el nuevo flujo, evitando duplicaciones y preservando compatibilidad con datos existentes.
- **FR-OPS-001**: La funcionalidad MUST ejecutarse en el entorno Docker existente con migraciones aplicables al arranque y healthcheck operativo sin pasos manuales adicionales.
- **FR-DOC-001**: La documentacion de API MUST reflejar creacion/actualizacion/consulta de procesos y registro de mediciones, incluyendo errores de validacion y autorizacion.

### Key Entities *(include if feature involves data)*

- **ProcesoMedicion**: Representa la ejecucion operativa de medicion para un pedido y, cuando aplique, para una linea especifica; su estado actual permitido es ESPERANDO, EN_PROCESO, COMPLETADO, FALLIDO o CANCELADO, con inicio y finalizacion trazables.
- **HistorialEstadoProceso**: Registro inmutable y cronologico de cada cambio de estado de un ProcesoMedicion con su observacion contextual, actor/rol y correlationId de origen.
- **Medicion**: Captura de resultado de control por proceso, vinculada a un modelo de producto y a validaciones de QR, peso, color y altura, con resultado final e informacion de actor/rol/correlationId para auditoria.
- **LineaPedido**: Entidad de pedido ya existente que recibe actualizaciones de procesadas/rechazadas derivadas de mediciones.
- **Pedido**: Entidad agregada que recalcula su progreso y estado conforme cambian sus lineas por resultados de medicion.
- **MonitorProceso**: Canal operativo que identifica origen o contexto de procesamiento y se reutiliza en el nuevo flujo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% de los procesos de medicion se inician en menos de 2 segundos desde la solicitud operativa.
- **SC-002**: 95% de los registros de medicion se reflejan en el progreso de linea y pedido en menos de 1 segundo.
- **SC-003**: 100% de mediciones registradas quedan asociadas a un proceso valido y trazables en consulta historica.
- **SC-004**: 100% de actualizaciones de progreso por medicion respetan limites de cantidad de linea y no generan sobreconteo.
- **SC-005**: 100% de relaciones invalidas pedido-linea-proceso son rechazadas antes de persistir datos inconsistentes.
- **SC-006**: 100% de operaciones al flujo de medicion sin JWT valido o fuera de matriz de rol/alcance son rechazadas.
- **SC-007**: Al menos 90% de supervisores pueden auditar una incidencia operativa consultando proceso, historial y mediciones en un solo flujo.
- **SC-008**: 100% de mediciones duplicadas detectadas no generan incrementos adicionales en procesadas/rechazadas.
- **SC-009**: 100% de mediciones quedan clasificadas correctamente en APROBADA, RECHAZADA o PENDIENTE segun la regla estricta de verificaciones.
- **SC-010**: 100% de transiciones de ProcesoMedicion cumplen la maquina de estados definida y las transiciones invalidas son rechazadas.
- **SC-011**: 100% de intentos de actualizacion manual en lineas con proceso activo son rechazados sin alterar contadores.
- **SC-012**: 100% de `idempotencyKey` malformadas o fuera de especificacion son rechazadas sin persistir medicion.

## Assumptions

- El flujo actual de pedidos y lineas ya se encuentra operativo y es la fuente de verdad para progreso y estados.
- Las mediciones se reciben como eventos discretos y cada evento representa una unidad de avance a contabilizar.
- El sistema de autenticacion JWT existente se reutiliza sin introducir un proveedor de identidad nuevo.
- La primera entrega cubre procesamiento por pedido y linea; analitica avanzada y reportes historicos masivos quedan fuera de alcance.
- Se prioriza compatibilidad con estructuras existentes de monitores y pedidos para evitar reprocesamientos manuales en despliegue.
