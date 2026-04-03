const { pool } = require('../postgres');

class RealtimeDeliveryRepository {
  async createPending({ eventName, eventType, correlationId, checkpointEventId = null, expiresAt }) {
    const query = `
      INSERT INTO realtime_delivery_records (event_name, event_type, correlation_id, checkpoint_event_id, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, event_name AS "eventName", event_type AS "eventType", correlation_id AS "correlationId", attempts, acked, expires_at AS "expiresAt";
    `;
    const { rows } = await pool.query(query, [eventName, eventType, correlationId, checkpointEventId, expiresAt]);
    return rows[0];
  }

  async markAcked(id) {
    await pool.query('UPDATE realtime_delivery_records SET acked = true, acked_at = now() WHERE id = $1', [id]);
  }
}

module.exports = {
  RealtimeDeliveryRepository
};
