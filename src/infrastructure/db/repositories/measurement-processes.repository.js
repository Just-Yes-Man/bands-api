const { pool } = require('../postgres');

class MeasurementProcessesRepository {
  async create({ orderId, lineId = null, estadoActual = 'ESPERANDO' }) {
    const result = await pool.query(
      `INSERT INTO procesos_medicion(pedido_id, linea_pedido_id, estado_actual)
       VALUES ($1, $2, $3)
       RETURNING id, pedido_id, linea_pedido_id, estado_actual, iniciado_en, finalizado_en, created_at, updated_at`,
      [orderId, lineId, estadoActual]
    );
    return result.rows[0];
  }

  async getById(processId) {
    const result = await pool.query(
      `SELECT id, pedido_id, linea_pedido_id, estado_actual, iniciado_en, finalizado_en, created_at, updated_at
       FROM procesos_medicion
       WHERE id = $1
       LIMIT 1`,
      [processId]
    );
    return result.rows[0] || null;
  }

  async listByOrder(orderId) {
    const result = await pool.query(
      `SELECT id, pedido_id, linea_pedido_id, estado_actual, iniciado_en, finalizado_en, created_at, updated_at
       FROM procesos_medicion
       WHERE pedido_id = $1
       ORDER BY created_at DESC`,
      [orderId]
    );
    return result.rows;
  }

  async hasActiveByLine(lineId) {
    if (!lineId) {
      return false;
    }
    const result = await pool.query(
      `SELECT 1
       FROM procesos_medicion
       WHERE linea_pedido_id = $1
         AND estado_actual IN ('ESPERANDO', 'EN_PROCESO')
       LIMIT 1`,
      [lineId]
    );
    return Boolean(result.rowCount);
  }

  async transitionState({ processId, fromState, toState }) {
    const result = await pool.query(
      `UPDATE procesos_medicion
       SET estado_actual = $3,
           iniciado_en = CASE
             WHEN $3 = 'EN_PROCESO' AND iniciado_en IS NULL THEN now()
             ELSE iniciado_en
           END,
           finalizado_en = CASE
             WHEN $3 IN ('COMPLETADO', 'FALLIDO', 'CANCELADO') THEN now()
             ELSE finalizado_en
           END,
           updated_at = now()
       WHERE id = $1
         AND estado_actual = $2
       RETURNING id, pedido_id, linea_pedido_id, estado_actual, iniciado_en, finalizado_en, created_at, updated_at`,
      [processId, fromState, toState]
    );
    return result.rows[0] || null;
  }
}

module.exports = {
  MeasurementProcessesRepository
};
