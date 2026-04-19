# Data Model: Flujo de Procesamiento y Medicion de Pedidos

## Entity: ProcesoMedicion
- Purpose: Orquestar el ciclo operativo de medicion para un pedido y, opcionalmente, una linea especifica.
- Fields:
  - id (serial, PK)
  - pedido_id (bigint/int, FK -> pedidos.id)
  - linea_pedido_id (bigint/int nullable, FK -> lineas_pedido.id)
  - estado_actual (enum: ESPERANDO, EN_PROCESO, COMPLETADO, FALLIDO, CANCELADO)
  - iniciado_en (timestamptz)
  - finalizado_en (timestamptz nullable)
  - created_at (timestamptz)
- Validation rules:
  - `pedido_id` debe existir.
  - Si `linea_pedido_id` existe, debe pertenecer a `pedido_id`.
  - `finalizado_en` solo aplica en estados terminales.
- State transitions:
  - ESPERANDO -> EN_PROCESO
  - EN_PROCESO -> COMPLETADO
  - EN_PROCESO -> FALLIDO
  - ESPERANDO -> CANCELADO
  - EN_PROCESO -> CANCELADO
  - No se permiten transiciones salientes desde COMPLETADO/FALLIDO/CANCELADO.

## Entity: HistorialEstadoProceso
- Purpose: Persistir auditoria inmutable de cada cambio de estado de un proceso de medicion.
- Fields:
  - id (bigserial, PK)
  - proceso_medicion_id (int, FK -> procesos_medicion.id)
  - estado (varchar(30))
  - timestamp_estado (timestamptz)
  - observacion (text nullable)
  - actor_user_id (int nullable, referencia a usuario autenticado cuando aplica)
  - actor_role (varchar(30), rol efectivo al ejecutar la accion)
  - actor_cliente_id (int nullable, requerido cuando actor_role=client)
  - correlation_id (varchar(120), identificador de trazabilidad extremo a extremo)
- Validation rules:
  - Debe existir al menos un registro inicial con estado ESPERANDO por cada proceso.
  - Los cambios deben respetar la maquina de estados permitida.
  - Escrituras originadas por API/realtime deben persistir `actor_role` y `correlation_id`.

## Entity: Medicion
- Purpose: Registrar validaciones de calidad de un item medido y su resultado final.
- Fields:
  - id (serial, PK)
  - proceso_medicion_id (int, FK -> procesos_medicion.id)
  - modelo_producto_id (int, FK -> modelos_producto.id)
  - qr_ok (boolean nullable)
  - peso_ok (boolean nullable)
  - color_ok (boolean nullable)
  - altura_ok (boolean nullable)
  - resultado_final (enum: PENDIENTE, APROBADA, RECHAZADA)
  - capturada_en (timestamptz)
  - idempotency_key (varchar(120), unique por proceso, formato `<origen>-<proceso>-<muestra>`)
  - actor_user_id (int nullable, referencia a usuario autenticado cuando aplica)
  - actor_role (varchar(30), rol efectivo al registrar la medicion)
  - actor_cliente_id (int nullable, requerido cuando actor_role=client)
  - correlation_id (varchar(120), identificador de trazabilidad extremo a extremo)
- Validation rules:
  - `resultado_final=APROBADA` solo si las cuatro verificaciones son true.
  - `resultado_final=RECHAZADA` si alguna verificacion es false.
  - `resultado_final=PENDIENTE` si falta alguna verificacion.
  - `idempotency_key` debe cumplir formato y longitud maxima definidos.
  - Duplicados por `idempotency_key` no deben volver a impactar progreso.
  - Escrituras originadas por API/realtime deben persistir `actor_role` y `correlation_id`.

## Entity: MonitorProceso
- Purpose: Representar canal/estacion de ejecucion de procesos y mantener compatibilidad con monitoreo existente.
- Fields:
  - id (serial, PK)
  - nombre (varchar)
  - canal (varchar)
  - activo (boolean)
  - created_at (timestamptz)
- Validation rules:
  - Reutilizar tabla existente; evitar recreacion incompatible.
  - Aplicar solo ajustes idempotentes (constraints/indices faltantes) para mantener compatibilidad de datos historicos.

## Derived View: ProgresoAplicadoPorMedicion
- Purpose: Traducir cada medicion final a deltas de linea/pedido.
- Fields:
  - proceso_medicion_id
  - pedido_id
  - linea_pedido_id
  - delta_procesadas
  - delta_rechazadas
  - resultado_final
  - aplicada_en
- Computation rules:
  - Si `resultado_final=APROBADA` -> `delta_procesadas=1`, `delta_rechazadas=0`.
  - Si `resultado_final=RECHAZADA` -> `delta_procesadas=0`, `delta_rechazadas=1`.
  - Si `resultado_final=PENDIENTE` -> no aplicar delta a progreso final.

## Cross-Entity Constraints
- Solo un proceso activo por linea (`ESPERANDO` o `EN_PROCESO`) en un mismo momento.
- Mientras exista proceso activo de linea, se bloquean actualizaciones manuales de progreso de esa linea.
- Mediciones y cambios de estado sobre procesos terminales deben rechazarse.
- Todo cambio de estado de proceso y aplicacion de medicion debe quedar trazado con timestamp y actor/contexto.
