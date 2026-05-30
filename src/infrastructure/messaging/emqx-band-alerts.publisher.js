const mqtt = require("mqtt");

const env = require("../config/env");
const { logger } = require("../logging/logger");

class EmqxBandAlertsPublisher {
  constructor() {
    this.enabled = Boolean(env.EMQX_ENABLED);
    this.topic = env.EMQX_BAND_ERROR_RESOLVE_TOPIC;
    this.qos = Number.isFinite(env.EMQX_QOS) ? env.EMQX_QOS : 1;
    this.client = null;
    this.connectPromise = null;
  }

  async resolveAlert({ errorId, resolvedBy }) {
    if (!this.enabled) {
      return { ok: false, skipped: true, reason: "emqx_disabled" };
    }

    const payload = {
      event: "bandas.error.resolver",
      errorId: errorId || null,
      resolvedBy: resolvedBy || "front",
      occurredAt: new Date().toISOString(),
      source: "bands-api",
    };

    const client = await this.ensureConnected();
    await new Promise((resolve, reject) => {
      client.publish(
        this.topic,
        JSON.stringify(payload),
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

    logger.info("band-alerts.emqx.resolve_published", {
      topic: this.topic,
      errorId,
    });

    return { ok: true, topic: this.topic, payload };
  }

  async ensureConnected() {
    if (this.client && this.client.connected) {
      return this.client;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      const client = mqtt.connect(env.EMQX_URL, {
        username: env.EMQX_USERNAME || undefined,
        password: env.EMQX_PASSWORD || undefined,
        clientId: `bands-api-alerts-${Math.random().toString(16).slice(2, 10)}`,
        reconnectPeriod: 3000,
        connectTimeout: 5000,
      });

      this.client = client;
      client.once("connect", () => resolve(client));
      client.once("error", (error) => reject(error));
    });

    try {
      return await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }
}

module.exports = {
  EmqxBandAlertsPublisher,
};
