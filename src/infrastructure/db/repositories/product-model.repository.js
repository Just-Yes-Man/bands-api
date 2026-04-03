const { pool } = require('../postgres');

class ProductModelRepository {
  async listActive() {
    const query = `
      SELECT id, tipo AS type, qr AS "qrCode", peso_esperado AS "expectedWeight",
             color_esperado AS "expectedColor", altura_esperada AS "expectedHeight",
             activo AS active
      FROM modelos_producto
      WHERE activo = true
      ORDER BY id ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async create({ type, qrCode, expectedWeight, expectedColor, expectedHeight }) {
    const query = `
      INSERT INTO modelos_producto (tipo, qr, peso_esperado, color_esperado, altura_esperada)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, tipo AS type, qr AS "qrCode", peso_esperado AS "expectedWeight",
                color_esperado AS "expectedColor", altura_esperada AS "expectedHeight", activo AS active;
    `;
    const { rows } = await pool.query(query, [type, qrCode, expectedWeight, expectedColor, expectedHeight]);
    return rows[0];
  }

  async findActiveByReference(reference) {
    if (reference) {
      const query = `
        SELECT id, tipo AS type, qr AS "qrCode", peso_esperado AS "expectedWeight",
               color_esperado AS "expectedColor", altura_esperada AS "expectedHeight", activo AS active
        FROM modelos_producto
        WHERE activo = true AND (tipo = $1 OR qr = $1)
        ORDER BY id ASC
        LIMIT 1;
      `;
      const { rows } = await pool.query(query, [reference]);
      return rows[0] || null;
    }

    const query = `
      SELECT id, tipo AS type, qr AS "qrCode", peso_esperado AS "expectedWeight",
             color_esperado AS "expectedColor", altura_esperada AS "expectedHeight", activo AS active
      FROM modelos_producto
      WHERE activo = true
      ORDER BY id ASC
      LIMIT 1;
    `;
    const { rows } = await pool.query(query);
    return rows[0] || null;
  }
}

module.exports = {
  ProductModelRepository
};
