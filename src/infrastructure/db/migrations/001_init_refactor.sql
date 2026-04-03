CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_identities (
  id SERIAL PRIMARY KEY,
  username VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','supervisor','operator')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS product_checkpoint_events (
  id SERIAL PRIMARY KEY,
  external_reference VARCHAR(120),
  measured_qr VARCHAR(120) NOT NULL,
  measured_weight NUMERIC NOT NULL,
  measured_color VARCHAR(40) NOT NULL,
  measured_height NUMERIC NOT NULL,
  model_id INT REFERENCES modelos_producto(id),
  monitor_id INT REFERENCES monitores_proceso(id),
  channel VARCHAR(30) NOT NULL DEFAULT '1',
  decision_weight_ok BOOLEAN,
  decision_color_ok BOOLEAN,
  decision_height_ok BOOLEAN,
  approved BOOLEAN,
  status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received','queued','reviewed','published')),
  performed_by INT REFERENCES operator_identities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS realtime_delivery_records (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(120) NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('critical','informative')),
  correlation_id VARCHAR(120) NOT NULL,
  checkpoint_event_id INT REFERENCES product_checkpoint_events(id),
  attempts INT NOT NULL DEFAULT 1,
  acked BOOLEAN NOT NULL DEFAULT false,
  acked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_status ON product_checkpoint_events(status);
CREATE INDEX IF NOT EXISTS idx_checkpoint_created_at ON product_checkpoint_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_delivery_event ON realtime_delivery_records(event_name, acked);
