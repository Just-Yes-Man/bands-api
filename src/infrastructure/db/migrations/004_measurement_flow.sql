CREATE TABLE IF NOT EXISTS procesos_medicion (
  id SERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  linea_pedido_id BIGINT REFERENCES lineas_pedido(id) ON DELETE SET NULL,
  estado_actual VARCHAR(20) NOT NULL CHECK (estado_actual IN ('ESPERANDO', 'EN_PROCESO', 'COMPLETADO', 'FALLIDO', 'CANCELADO')),
  iniciado_en TIMESTAMPTZ,
  finalizado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historial_estados_proceso (
  id BIGSERIAL PRIMARY KEY,
  proceso_medicion_id INT NOT NULL REFERENCES procesos_medicion(id) ON DELETE CASCADE,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('ESPERANDO', 'EN_PROCESO', 'COMPLETADO', 'FALLIDO', 'CANCELADO')),
  timestamp_estado TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacion TEXT,
  actor_user_id BIGINT,
  actor_role VARCHAR(30) NOT NULL DEFAULT 'system',
  actor_cliente_id BIGINT,
  correlation_id VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS mediciones (
  id SERIAL PRIMARY KEY,
  proceso_medicion_id INT NOT NULL REFERENCES procesos_medicion(id) ON DELETE CASCADE,
  modelo_producto_id INT NOT NULL REFERENCES modelos_producto(id),
  qr_ok BOOLEAN,
  peso_ok BOOLEAN,
  color_ok BOOLEAN,
  altura_ok BOOLEAN,
  resultado_final VARCHAR(20) NOT NULL CHECK (resultado_final IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
  capturada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key VARCHAR(120) NOT NULL,
  actor_user_id BIGINT,
  actor_role VARCHAR(30) NOT NULL DEFAULT 'system',
  actor_cliente_id BIGINT,
  correlation_id VARCHAR(120) NOT NULL,
  UNIQUE (proceso_medicion_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_procesos_medicion_pedido ON procesos_medicion(pedido_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_procesos_medicion_linea ON procesos_medicion(linea_pedido_id, estado_actual) WHERE linea_pedido_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_historial_estados_proceso_proceso ON historial_estados_proceso(proceso_medicion_id, timestamp_estado DESC);
CREATE INDEX IF NOT EXISTS idx_mediciones_proceso_capturada ON mediciones(proceso_medicion_id, capturada_en DESC);
CREATE INDEX IF NOT EXISTS idx_mediciones_resultado ON mediciones(resultado_final, capturada_en DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_procesos_medicion_activo_linea
  ON procesos_medicion(linea_pedido_id)
  WHERE linea_pedido_id IS NOT NULL AND estado_actual IN ('ESPERANDO', 'EN_PROCESO');

-- Monitor consistency guards: preserve compatibility with existing monitores_proceso table.
ALTER TABLE monitores_proceso
  ALTER COLUMN canal SET DEFAULT '1';

CREATE INDEX IF NOT EXISTS idx_monitores_proceso_canal_activo
  ON monitores_proceso(canal, activo);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_monitores_proceso_canal_no_vacio'
  ) THEN
    ALTER TABLE monitores_proceso
      ADD CONSTRAINT ck_monitores_proceso_canal_no_vacio
      CHECK (length(trim(canal)) > 0);
  END IF;
END $$;
