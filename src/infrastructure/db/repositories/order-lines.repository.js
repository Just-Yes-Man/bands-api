const { pool } = require("../postgres");

class OrderLinesRepository {
  async createMany({ orderId, lineas }) {
    const created = [];
    for (const linea of lineas) {
      const result = await pool.query(
        `INSERT INTO lineas_pedido(pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version)
         VALUES ($1, $2, $3, 0, 0, 'ACTIVA', 0)
         RETURNING id, pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version, created_at, updated_at`,
        [orderId, linea.modeloProductoId, linea.cantidad],
      );
      created.push(result.rows[0]);
    }
    return created;
  }

  async listByOrder(orderId) {
    const result = await pool.query(
      `SELECT id, pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version, created_at, updated_at
       FROM lineas_pedido
       WHERE pedido_id = $1
       ORDER BY id ASC`,
      [orderId],
    );
    return result.rows;
  }

  async getById(lineId) {
    const result = await pool.query(
      `SELECT id, pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version, created_at, updated_at
       FROM lineas_pedido WHERE id = $1 LIMIT 1`,
      [lineId],
    );
    return result.rows[0] || null;
  }

  async updateProgress({
    lineId,
    deltaProcesadas,
    deltaRechazadas,
    expectedVersion,
  }) {
    const result = await pool.query(
      `UPDATE lineas_pedido
       SET procesadas = procesadas + $2,
           rechazadas = rechazadas + $3,
           version = version + 1,
           updated_at = now(),
           estado_linea = CASE
             WHEN (procesadas + $2 + rechazadas + $3) >= cantidad THEN 'CERRADA'
             ELSE estado_linea
           END
       WHERE id = $1 AND version = $4 AND estado_linea != 'CANCELADA'
       RETURNING id, pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version, created_at, updated_at`,
      [lineId, deltaProcesadas, deltaRechazadas, expectedVersion],
    );
    return result.rows[0] || null;
  }

  async cancelLine({ lineId }) {
    const result = await pool.query(
      `UPDATE lineas_pedido
       SET estado_linea = 'CANCELADA', updated_at = now(), version = version + 1
       WHERE id = $1 AND estado_linea != 'CANCELADA'
       RETURNING id, pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version, created_at, updated_at`,
      [lineId],
    );
    return result.rows[0] || null;
  }

  async cancelByOrder({ orderId }) {
    const result = await pool.query(
      `UPDATE lineas_pedido
       SET estado_linea = 'CANCELADA', updated_at = now(), version = version + 1
       WHERE pedido_id = $1 AND estado_linea != 'CANCELADA'
       RETURNING id, pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version, created_at, updated_at`,
      [orderId],
    );
    return result.rows;
  }

  async applyMeasurementProgress({ lineId, deltaProcesadas, deltaRechazadas }) {
    const result = await pool.query(
      `UPDATE lineas_pedido
       SET procesadas = procesadas + $2,
           rechazadas = rechazadas + $3,
           version = version + 1,
           updated_at = now(),
           estado_linea = CASE
             WHEN (procesadas + $2 + rechazadas + $3) >= cantidad THEN 'CERRADA'
             ELSE estado_linea
           END
       WHERE id = $1
         AND estado_linea = 'ACTIVA'
         AND (procesadas + rechazadas + $2 + $3) <= cantidad
       RETURNING id, pedido_id, modelo_producto_id, cantidad, procesadas, rechazadas, estado_linea, version, created_at, updated_at`,
      [lineId, deltaProcesadas, deltaRechazadas],
    );

    return result.rows[0] || null;
  }
}

module.exports = {
  OrderLinesRepository,
};
