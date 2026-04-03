const { pool } = require('../postgres');

class OperatorIdentityRepository {
  async findByUsername(username) {
    const query = `
      SELECT id, username, role, active, password_hash AS "passwordHash"
      FROM operator_identities
      WHERE username = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [username]);
    return rows[0] || null;
  }
}

module.exports = {
  OperatorIdentityRepository
};
