const { pool } = require('../postgres');

class OrderStateEventsRepository {
  async record({ orderId, lineId, eventType, actorType, actorId, payload }) {
    await pool.query(
      `INSERT INTO pedido_state_events(pedido_id, linea_pedido_id, event_type, actor_type, actor_id, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [orderId, lineId || null, eventType, actorType || 'SYSTEM', actorId || 'system', JSON.stringify(payload || {})]
    );
  }
}

module.exports = {
  OrderStateEventsRepository
};
