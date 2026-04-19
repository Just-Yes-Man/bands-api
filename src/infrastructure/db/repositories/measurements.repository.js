const { pool } = require('../postgres');

class MeasurementsRepository {
  async findByIdempotencyKey({ processId, idempotencyKey }) {
    const result = await pool.query(
      `SELECT id, proceso_medicion_id, modelo_producto_id, qr_ok, peso_ok, color_ok, altura_ok,
              resultado_final, capturada_en, idempotency_key, actor_user_id, actor_role, actor_cliente_id, correlation_id
       FROM mediciones
       WHERE proceso_medicion_id = $1 AND idempotency_key = $2
       LIMIT 1`,
      [processId, idempotencyKey]
    );
    return result.rows[0] || null;
  }

  async create({
    processId,
    modeloProductoId,
    qrOk = null,
    pesoOk = null,
    colorOk = null,
    alturaOk = null,
    resultadoFinal,
    idempotencyKey,
    actorUserId = null,
    actorRole = 'system',
    actorClienteId = null,
    correlationId
  }) {
    const result = await pool.query(
      `INSERT INTO mediciones(
        proceso_medicion_id,
        modelo_producto_id,
        qr_ok,
        peso_ok,
        color_ok,
        altura_ok,
        resultado_final,
        idempotency_key,
        actor_user_id,
        actor_role,
        actor_cliente_id,
        correlation_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (proceso_medicion_id, idempotency_key) DO NOTHING
      RETURNING id, proceso_medicion_id, modelo_producto_id, qr_ok, peso_ok, color_ok, altura_ok,
                resultado_final, capturada_en, idempotency_key, actor_user_id, actor_role, actor_cliente_id, correlation_id`,
      [
        processId,
        modeloProductoId,
        qrOk,
        pesoOk,
        colorOk,
        alturaOk,
        resultadoFinal,
        idempotencyKey,
        actorUserId,
        actorRole,
        actorClienteId,
        correlationId
      ]
    );

    return result.rows[0] || null;
  }

  async listByProcess(processId) {
    const result = await pool.query(
      `SELECT id, proceso_medicion_id, modelo_producto_id, qr_ok, peso_ok, color_ok, altura_ok,
              resultado_final, capturada_en, idempotency_key, actor_user_id, actor_role, actor_cliente_id, correlation_id
       FROM mediciones
       WHERE proceso_medicion_id = $1
       ORDER BY capturada_en ASC, id ASC`,
      [processId]
    );
    return result.rows;
  }
}

module.exports = {
  MeasurementsRepository
};
