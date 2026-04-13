const mqtt = require('mqtt');

const env = require('../config/env');
const { logger } = require('../logging/logger');

class EmqxOrdersPublisher {
  constructor() {
    this.enabled = Boolean(env.EMQX_ENABLED);
    this.topic = env.EMQX_ORDERS_CREATE_TOPIC || 'pedidos/creacion';
    this.qos = Number.isFinite(env.EMQX_QOS) ? env.EMQX_QOS : 1;
    this.client = null;
    this.connectPromise = null;
  }

  async publishOrderCreated({ orderDetail, actor }) {
    if (!this.enabled) {
      return { ok: false, skipped: true, reason: 'emqx_disabled' };
    }

    const client = await this.ensureConnected();

    const payload = JSON.stringify({
      event: 'pedido.creado',
      occurredAt: new Date().toISOString(),
      order: orderDetail && orderDetail.order ? orderDetail.order : null,
      progress: orderDetail && orderDetail.progress ? orderDetail.progress : null,
      lineas: orderDetail && Array.isArray(orderDetail.lineas) ? orderDetail.lineas : [],
      actor: actor ? { sub: actor.sub || null, role: actor.role || null } : null
    });

    await new Promise((resolve, reject) => {
      client.publish(this.topic, payload, { qos: this.qos, retain: false }, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    logger.info('orders.emqx.published', {
      topic: this.topic,
      qos: this.qos,
      orderId: orderDetail && orderDetail.order ? orderDetail.order.id : null
    });

    return { ok: true };
  }

  async ensureConnected() {
    if (this.client && this.client.connected) {
      return this.client;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      const options = {
        username: env.EMQX_USERNAME || undefined,
        password: env.EMQX_PASSWORD || undefined,
        clientId: env.EMQX_CLIENT_ID || `bands-api-${Math.random().toString(16).slice(2, 10)}`,
        reconnectPeriod: 3000,
        connectTimeout: 5000
      };

      const client = mqtt.connect(env.EMQX_URL, options);
      this.client = client;

      client.once('connect', () => {
        logger.info('orders.emqx.connected', { url: env.EMQX_URL, topic: this.topic });
        resolve(client);
      });

      client.once('error', (error) => {
        logger.error('orders.emqx.connect_error', { message: error.message });
        reject(error);
      });
    });

    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }
}

module.exports = {
  EmqxOrdersPublisher
};
