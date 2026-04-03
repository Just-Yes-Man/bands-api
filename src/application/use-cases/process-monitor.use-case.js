const { pool } = require('../../infrastructure/db/postgres');

class ProcessMonitorUseCase {
  async listActive() {
    const { rows } = await pool.query(
      'SELECT id, nombre AS name, canal AS channel, activo AS active FROM monitores_proceso WHERE activo = true ORDER BY id ASC'
    );
    return rows;
  }

  async deactivate(id) {
    const { rows } = await pool.query(
      'UPDATE monitores_proceso SET activo = false WHERE id = $1 RETURNING id, nombre AS name, canal AS channel, activo AS active',
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = {
  ProcessMonitorUseCase
};
