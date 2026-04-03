const { pool } = require('../postgres');

class ClientAuthRepository {
  async findByNombre(nombre) {
    const result = await pool.query(
      'SELECT id, nombre, contrasena, COALESCE(activo, true) AS activo FROM clientes WHERE nombre = $1 LIMIT 1',
      [nombre]
    );
    return result.rows[0] || null;
  }

  async create({ nombre, contrasenaHash }) {
    const result = await pool.query(
      `INSERT INTO clientes(nombre, contrasena)
       VALUES ($1, $2)
       RETURNING id, nombre, COALESCE(activo, true) AS activo`,
      [nombre, contrasenaHash]
    );
    return result.rows[0];
  }
}

module.exports = {
  ClientAuthRepository
};
