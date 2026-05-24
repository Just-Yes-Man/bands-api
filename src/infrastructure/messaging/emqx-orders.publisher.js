const mqtt = require("mqtt");

const env = require("../config/env");
const { logger } = require("../logging/logger");

class EmqxOrdersPublisher {
  constructor() {
    this.enabled = Boolean(env.EMQX_ENABLED);
    this.topic = env.EMQX_ORDERS_CREATE_TOPIC || "pedidos/creacion";
    this.progressTopic = env.EMQX_ORDERS_PROGRESS_TOPIC || "pedidos/avances";
    this.qos = Number.isFinite(env.EMQX_QOS) ? env.EMQX_QOS : 1;
    this.client = null;
    this.connectPromise = null;
  }

  async publishOrderCreated({ orderDetail, actor }) {
    if (!this.enabled) {
      return { ok: false, skipped: true, reason: "emqx_disabled" };
    }

    return this.publishEvent({
      topic: this.topic,
      payload: {
        event: "pedido.creado",
        source: "bands-api",
        occurredAt: new Date().toISOString(),
        order: orderDetail && orderDetail.order ? orderDetail.order : null,
        progress:
          orderDetail && orderDetail.progress ? orderDetail.progress : null,
        lineas:
          orderDetail && Array.isArray(orderDetail.lineas)
            ? orderDetail.lineas
            : [],
        actor: actor
          ? { sub: actor.sub || null, role: actor.role || null }
          : null,
      },
      orderId: orderDetail && orderDetail.order ? orderDetail.order.id : null,
    });
  }

  async publishOrderProgress({ orderDetail, actor, reason }) {
    if (!this.enabled) {
      return { ok: false, skipped: true, reason: "emqx_disabled" };
    }

    return this.publishEvent({
      topic: this.progressTopic,
      payload: {
        event: "pedido.avance",
        source: "bands-api",
        reason: reason || "updated",
        occurredAt: new Date().toISOString(),
        order: orderDetail && orderDetail.order ? orderDetail.order : null,
        progress:
          orderDetail && orderDetail.progress ? orderDetail.progress : null,
        lineas:
          orderDetail && Array.isArray(orderDetail.lineas)
            ? orderDetail.lineas
            : [],
        actor: actor
          ? { sub: actor.sub || null, role: actor.role || null }
          : null,
      },
      orderId: orderDetail && orderDetail.order ? orderDetail.order.id : null,
    });
  }

  async publishEvent({ topic, payload, orderId }) {
    const client = await this.ensureConnected();
    const encodedPayload = JSON.stringify(payload);

    await new Promise((resolve, reject) => {
      client.publish(
        topic,
        encodedPayload,
        { qos: this.qos, retain: false },
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });

    logger.info("orders.emqx.published", {
      topic,
      qos: this.qos,
      orderId,
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
        clientId:
          env.EMQX_CLIENT_ID ||
          `bands-api-${Math.random().toString(16).slice(2, 10)}`,
        reconnectPeriod: 3000,
        connectTimeout: 5000,
      };

      const client = mqtt.connect(env.EMQX_URL, options);
      this.client = client;

      client.once("connect", () => {
        logger.info("orders.emqx.connected", {
          url: env.EMQX_URL,
          createTopic: this.topic,
          progressTopic: this.progressTopic,
        });
        resolve(client);
      });

      client.once("error", (error) => {
        logger.error("orders.emqx.connect_error", { message: error.message });
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
  EmqxOrdersPublisher,
};
