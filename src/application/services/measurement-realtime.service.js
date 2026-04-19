const { logger } = require('../../infrastructure/logging/logger');
const env = require('../../infrastructure/config/env');

class MeasurementRealtimeService {
  constructor() {
    this.namespace = env.MEASUREMENT_REALTIME_NAMESPACE || '/realtime/v1';
    this.criticalRetryAttempts = Math.max(1, Number(env.MEASUREMENT_CRITICAL_RETRY_ATTEMPTS) || 3);
  }

  async emitCritical(io, eventName, payload) {
    if (!io) {
      return { delivered: false, reason: 'io_not_available' };
    }

    const namespace = io.of(this.namespace);
    let attempts = 0;
    let acked = false;

    while (attempts < this.criticalRetryAttempts && !acked) {
      attempts += 1;
      namespace.emit(eventName, payload);
      acked = true;
    }

    logger.info('measurement.realtime.critical', { eventName, attempts, acked });
    return { delivered: acked, attempts };
  }

  emitInformative(io, eventName, payload) {
    if (!io) {
      return;
    }

    io.of(this.namespace).emit(eventName, payload);
    logger.info('measurement.realtime.informative', { eventName });
  }
}

module.exports = {
  MeasurementRealtimeService
};
