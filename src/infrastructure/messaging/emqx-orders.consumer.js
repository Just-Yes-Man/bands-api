const mqtt = require("mqtt");

const env = require("../config/env");
const { logger } = require("../logging/logger");
const {
  isTerminalState,
} = require("../../domain/policies/measurement-process-state-policy");

class EmqxOrdersConsumer {
  constructor({
    ordersService,
    measurementCaptureService,
    measurementProcessesService,
  }) {
    this.ordersService = ordersService;
    this.measurementCaptureService = measurementCaptureService;
    this.measurementProcessesService = measurementProcessesService;
    this.client = null;
    this.io = null;
  }

  start({ io }) {
    if (!env.EMQX_ENABLED) {
      logger.info("emqx.consumer.disabled");
      return { ok: false, skipped: true, reason: "emqx_disabled" };
    }

    if (this.client) {
      return { ok: true, skipped: true, reason: "already_started" };
    }

    this.io = io;

    const options = {
      username: env.EMQX_USERNAME || undefined,
      password: env.EMQX_PASSWORD || undefined,
      clientId:
        env.EMQX_CLIENT_ID ||
        `bands-api-consumer-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 3000,
      connectTimeout: 5000,
    };

    this.client = mqtt.connect(env.EMQX_URL, options);

    this.client.on("connect", () => {
      const topics = [
        env.EMQX_ORDERS_PROGRESS_TOPIC || "pedidos/avances",
        env.EMQX_MEASUREMENTS_TOPIC || "productos/mediciones",
      ];

      const qos = Number.isFinite(env.EMQX_QOS) ? env.EMQX_QOS : 1;
      this.client.subscribe(topics, { qos }, (error) => {
        if (error) {
          logger.error("emqx.consumer.subscribe_error", {
            message: error.message,
          });
          return;
        }
        logger.info("emqx.consumer.subscribed", { topics });
      });
    });

    this.client.on("message", (topic, payload) => {
      this.handleMessage(topic, payload).catch((error) => {
        logger.error("emqx.consumer.message_error", {
          message: error.message,
          topic,
        });
      });
    });

    this.client.on("error", (error) => {
      logger.error("emqx.consumer.error", { message: error.message });
    });

    return { ok: true };
  }

  stop() {
    if (!this.client) {
      return;
    }
    this.client.end(true);
    this.client = null;
  }

  async handleMessage(topic, payloadBuffer) {
    const payload = this.safeParse(payloadBuffer);
    if (!payload) {
      return;
    }

    if (payload.source === "bands-api") {
      return;
    }

    if (topic === (env.EMQX_ORDERS_PROGRESS_TOPIC || "pedidos/avances")) {
      await this.handleProgress(payload);
      return;
    }

    if (topic === (env.EMQX_MEASUREMENTS_TOPIC || "productos/mediciones")) {
      await this.handleMeasurement(payload);
    }
  }

  async handleProgress(payload) {
    const event = payload.event || payload.evento;
    if (event && event !== "pedido.avance") {
      return;
    }

    const orderId = this.asNumber(
      payload.orderId || payload.pedidoId || payload.order?.id,
    );
    const lineId = this.asNumber(
      payload.lineId || payload.lineaPedidoId || payload.line?.id,
    );
    const deltaProcesadas =
      this.asNumber(payload.deltaProcesadas || payload.delta_procesadas || 0) ||
      0;
    const deltaRechazadas =
      this.asNumber(payload.deltaRechazadas || payload.delta_rechazadas || 0) ||
      0;

    if (!orderId || !lineId) {
      logger.warn("emqx.consumer.progress.invalid", { orderId, lineId });
      return;
    }

    if (deltaProcesadas <= 0 && deltaRechazadas <= 0) {
      return;
    }

    const result = await this.ordersService.applyExternalLineProgress({
      orderId,
      lineId,
      deltaProcesadas,
      deltaRechazadas,
      actor: null,
      io: this.io,
      source: payload.source || "emqx",
    });

    if (!result || !result.ok) {
      logger.warn("emqx.consumer.progress.skipped", {
        orderId,
        lineId,
        reason: result && result.reason ? result.reason : "unknown",
      });
    }
  }

  async handleMeasurement(payload) {
    const event = payload.event || payload.evento;
    if (
      event &&
      event !== "producto.medicion" &&
      event !== "producto.mediciones.generadas"
    ) {
      return;
    }

    const orderId = this.asNumber(
      payload.pedidoId || payload.orderId || payload.order?.id,
    );
    const lineId = this.asNumber(
      payload.lineaPedidoId || payload.lineId || payload.line?.id,
    );
    const modeloProductoId = this.asNumber(
      payload.modeloProductoId || payload.productoId || payload.product?.id,
    );
    const idempotencyKey = payload.idempotencyKey;

    if (!orderId || !lineId || !modeloProductoId || !idempotencyKey) {
      logger.warn("emqx.consumer.measurement.invalid", {
        orderId,
        lineId,
        modeloProductoId,
        hasKey: Boolean(idempotencyKey),
      });
      return;
    }

    const process = await this.resolveProcess({ orderId, lineId });
    if (!process) {
      logger.warn("emqx.consumer.measurement.process_missing", {
        orderId,
        lineId,
      });
      return;
    }

    await this.measurementCaptureService.registerMeasurement({
      processId: Number(process.id),
      modeloProductoId,
      idempotencyKey,
      qrOk: payload.qrOk,
      pesoOk: payload.pesoOk,
      colorOk: payload.colorOk,
      alturaOk: payload.alturaOk,
      actor: null,
      io: this.io,
      applyProgress: false,
    });
  }

  async resolveProcess({ orderId, lineId }) {
    const processes =
      await this.measurementProcessesService.listProcessesByOrder({
        orderId,
        actor: null,
      });

    const match = processes.find(
      (process) => Number(process.lineaPedidoId) === Number(lineId),
    );

    if (match) {
      if (isTerminalState(match.estadoActual)) {
        return null;
      }
      return match;
    }

    const created = await this.measurementProcessesService.createProcess({
      orderId,
      lineaPedidoId: lineId,
      observacion: "auto: emqx measurement",
      actor: null,
      io: this.io,
    });

    return created || null;
  }

  safeParse(buffer) {
    if (!buffer || !buffer.length) {
      return null;
    }

    try {
      return JSON.parse(buffer.toString());
    } catch (error) {
      logger.warn("emqx.consumer.parse_error", { message: error.message });
      return null;
    }
  }

  asNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

module.exports = {
  EmqxOrdersConsumer,
};
