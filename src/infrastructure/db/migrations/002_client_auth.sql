ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_clientes_nombre'
  ) THEN
    ALTER TABLE clientes
      ADD CONSTRAINT uq_clientes_nombre UNIQUE (nombre);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS authentication_audit_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(40) NOT NULL CHECK (
    event_type IN ('register_success','register_failure','login_success','login_failure')
  ),
  client_identifier VARCHAR(120) NOT NULL,
  source_ip VARCHAR(100),
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success','failure')),
  reason_code VARCHAR(60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_identifier_ts
  ON authentication_audit_events(client_identifier, created_at DESC);
