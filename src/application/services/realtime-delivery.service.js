const { RealtimeDeliveryRepository } = require('../../infrastructure/db/repositories/realtime-delivery.repository');

class RealtimeDeliveryService {
  constructor(repository = new RealtimeDeliveryRepository()) {
    this.repository = repository;
  }

  isCritical(eventName) {
    return ['checkpoint.queued.v1', 'checkpoint.reviewed.v1'].includes(eventName);
  }

  async registerDispatch(eventName, correlationId, checkpointEventId = null) {
    const eventType = this.isCritical(eventName) ? 'critical' : 'informative';
    if (eventType === 'informative') {
      return null;
    }

    const expiresAt = new Date(Date.now() + 30 * 1000);
    return this.repository.createPending({ eventName, eventType, correlationId, checkpointEventId, expiresAt });
  }
}

module.exports = {
  RealtimeDeliveryService
};
