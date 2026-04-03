const { pool } = require('../postgres');

class AuthAuditRepository {
  async record({ eventType, clientIdentifier, sourceIp, outcome, reasonCode }) {
    await pool.query(
      `INSERT INTO authentication_audit_events(event_type, client_identifier, source_ip, outcome, reason_code)
       VALUES ($1, $2, $3, $4, $5)`,
      [eventType, clientIdentifier, sourceIp || null, outcome, reasonCode || null]
    );
  }
}

module.exports = {
  AuthAuditRepository
};
