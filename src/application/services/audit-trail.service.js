const { logger } = require('../../infrastructure/logging/logger');

class AuditTrailService {
  log(eventName, actor, metadata = {}) {
    logger.info('audit.event', {
      eventName,
      actor: actor ? actor.sub || actor.id || null : null,
      role: actor ? actor.role || null : null,
      metadata
    });
  }
}

module.exports = {
  AuditTrailService
};
