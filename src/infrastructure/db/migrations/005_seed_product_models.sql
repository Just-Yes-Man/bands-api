INSERT INTO modelos_producto (tipo, qr, peso_esperado, color_esperado, altura_esperada)
VALUES
  ('taza', 'QR-TAZA-001', 220, 'blanco', 95),
  ('plato', 'QR-PLATO-001', 450, 'blanco', 25),
  ('vaso', 'QR-VASO-001', 180, 'transparente', 120),
  ('copa', 'QR-COPA-001', 200, 'transparente', 140),
  ('tazon', 'QR-TAZON-001', 320, 'blanco', 70)
ON CONFLICT DO NOTHING;
