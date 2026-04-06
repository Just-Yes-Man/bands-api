const { pool } = require('../postgres');

class OrdersRepository {
  async createOrderHeader({ clienteId }) {
    const result = await pool.query(
      `INSERT INTO pedidos(cliente_id, estado, version)
       VALUES ($1, 'PENDIENTE', 0)
       RETURNING id, cliente_id, estado, version, created_at, updated_at`,
      [clienteId]
    );
    return result.rows[0];
  }

  async getById(orderId) {
    const result = await pool.query(
      `SELECT id, cliente_id, estado, version, created_at, updated_at
       FROM pedidos WHERE id = $1 LIMIT 1`,
      [orderId]
    );
    return result.rows[0] || null;
  }

  async listByClient(clienteId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const [itemsResult, totalResult] = await Promise.all([
      pool.query(
        `SELECT id, cliente_id, estado, version, created_at, updated_at
         FROM pedidos
         WHERE cliente_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [clienteId, pageSize, offset]
      ),
      pool.query('SELECT COUNT(*)::int AS total FROM pedidos WHERE cliente_id = $1', [clienteId])
    ]);

    return {
      items: itemsResult.rows,
      total: totalResult.rows[0] ? totalResult.rows[0].total : 0,
      page,
      pageSize
    };
  }

  async transitionStatus({ orderId, status }) {
    const result = await pool.query(
      `UPDATE pedidos
       SET estado = $2, updated_at = now(), version = version + 1
       WHERE id = $1
       RETURNING id, cliente_id, estado, version, created_at, updated_at`,
      [orderId, status]
    );
    return result.rows[0] || null;
  }
}

module.exports = {
  OrdersRepository
};
