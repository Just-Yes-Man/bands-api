const { pool } = require('../postgres');

class MeasurementProcessStateHistoryRepository {
  async record({ processId, estado, observacion = null, actorUserId = null, actorRole = 'system', actorClienteId = null, correlationId }) {
    await pool.query(
      `INSERT INTO historial_estados_proceso(
        proceso_medicion_id,
        estado,
        observacion,
        actor_user_id,
        actor_role,
        actor_cliente_id,
        correlation_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [processId, estado, observacion, actorUserId, actorRole, actorClienteId, correlationId]
    );
  }

  async listByProcess(processId) {
    const result = await pool.query(
      `SELECT id, proceso_medicion_id, estado, timestamp_estado, observacion,
              actor_user_id, actor_role, actor_cliente_id, correlation_id
       FROM historial_estados_proceso
       WHERE proceso_medicion_id = $1
       ORDER BY timestamp_estado ASC, id ASC`,
      [processId]
    );
    return result.rows;
  }
}

module.exports = {
  MeasurementProcessStateHistoryRepository
};
