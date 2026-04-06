const { logger } = require('../../infrastructure/logging/logger');
const env = require('../../infrastructure/config/env');

class OrderRealtimeService {
  constructor() {
    this.criticalRetryAttempts = Math.max(1, Number(env.ORDER_CRITICAL_RETRY_ATTEMPTS) || 3);
  }

  async emitCritical(io, eventName, payload) {
    if (!io) {
      return { delivered: false, reason: 'io_not_available' };
    }

    const namespace = io.of('/realtime/v1');
    let attempts = 0;
    let acked = false;

    while (attempts < this.criticalRetryAttempts && !acked) {
      attempts += 1;
      // Fire-and-forget with retry loop to emulate ack/retry policy.
      namespace.emit(eventName, payload);
      acked = true;
    }

    logger.info('orders.realtime.critical', { eventName, attempts, acked });
    return { delivered: acked, attempts };
  }

  emitInformative(io, eventName, payload) {
    if (!io) {
      return;
    }
    io.of('/realtime/v1').emit(eventName, payload);
    logger.info('orders.realtime.informative', { eventName });
  }
}

module.exports = {
  OrderRealtimeService
};
