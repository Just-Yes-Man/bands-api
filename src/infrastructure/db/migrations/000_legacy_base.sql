CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  contrasena VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS modelos_producto (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(80) NOT NULL UNIQUE,
  qr VARCHAR(120) NOT NULL UNIQUE,
  peso_esperado INT NOT NULL,
  color_esperado VARCHAR(40) NOT NULL,
  altura_esperada INT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO modelos_producto (tipo, qr, peso_esperado, color_esperado, altura_esperada)
VALUES
  ('taza', 'QR-TAZA-001', 220, 'blanco', 95),
  ('plato', 'QR-PLATO-001', 450, 'blanco', 25),
  ('vaso', 'QR-VASO-001', 180, 'transparente', 120),
  ('copa', 'QR-COPA-001', 200, 'transparente', 140),
  ('tazon', 'QR-TAZON-001', 320, 'blanco', 70)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_modelos_tipo ON modelos_producto(tipo);
CREATE INDEX IF NOT EXISTS idx_modelos_qr ON modelos_producto(qr);

CREATE TABLE IF NOT EXISTS monitores_proceso (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  canal VARCHAR(30) NOT NULL DEFAULT '1',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
