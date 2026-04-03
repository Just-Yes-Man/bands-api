const { randomUUID } = require('crypto');
const { RealtimeDeliveryService } = require('../../../../application/services/realtime-delivery.service');

class RealtimePublisher {
  constructor(namespace, deliveryService = new RealtimeDeliveryService()) {
    this.namespace = namespace;
    this.deliveryService = deliveryService;
  }

  async publish(eventName, payload) {
    const correlationId = randomUUID();
    await this.deliveryService.registerDispatch(eventName, correlationId, payload.id || null);
    this.namespace.emit(eventName, { ...payload, correlationId });
  }
}

module.exports = {
  RealtimePublisher
};
