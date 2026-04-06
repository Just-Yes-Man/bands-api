CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id),
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO')),
  version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lineas_pedido (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  modelo_producto_id INT NOT NULL REFERENCES modelos_producto(id),
  cantidad INT NOT NULL CHECK (cantidad > 0),
  procesadas INT NOT NULL DEFAULT 0 CHECK (procesadas >= 0),
  rechazadas INT NOT NULL DEFAULT 0 CHECK (rechazadas >= 0),
  estado_linea VARCHAR(20) NOT NULL CHECK (estado_linea IN ('ACTIVA', 'CANCELADA', 'CERRADA')),
  version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_linea_totals CHECK (procesadas + rechazadas <= cantidad)
);

CREATE TABLE IF NOT EXISTS pedido_state_events (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  linea_pedido_id BIGINT REFERENCES lineas_pedido(id) ON DELETE SET NULL,
  event_type VARCHAR(40) NOT NULL,
  actor_type VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
  actor_id VARCHAR(120) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_estado
  ON pedidos(cliente_id, estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lineas_pedido_pedido
  ON lineas_pedido(pedido_id, id);

CREATE INDEX IF NOT EXISTS idx_pedido_state_events_pedido
  ON pedido_state_events(pedido_id, created_at DESC);
