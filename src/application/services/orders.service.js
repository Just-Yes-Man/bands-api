const {
  computeOrderStatus,
  ORDER_STATUS,
} = require("../../domain/policies/order-state-policy");
const { asOrderError } = require("../../shared/errors/order-errors");

const { logger } = require("../../infrastructure/logging/logger");

class OrdersService {
  constructor({
    ordersRepository,
    orderLinesRepository,
    orderStateEventsRepository,
    orderRealtimeService,
    ordersEventPublisher = null,
    measurementProcessesRepository = null,
  }) {
    this.ordersRepository = ordersRepository;
    this.orderLinesRepository = orderLinesRepository;
    this.orderStateEventsRepository = orderStateEventsRepository;
    this.orderRealtimeService = orderRealtimeService;
    this.ordersEventPublisher = ordersEventPublisher;
    this.measurementProcessesRepository = measurementProcessesRepository;
  }

  async createOrder({ clienteId, lineas, actor, io }) {
    this.assertClientOwnership({ actor, clienteId });

    const order = await this.ordersRepository.createOrderHeader({ clienteId });
    const createdLines = await this.orderLinesRepository.createMany({
      orderId: order.id,
      lineas,
    });

    await this.orderStateEventsRepository.record({
      orderId: order.id,
      eventType: "CREATED",
      actorType: actor && actor.role ? "USER" : "SYSTEM",
      actorId: actor && actor.sub ? String(actor.sub) : "system",
      payload: { clienteId, lineCount: createdLines.length },
    });

    await this.orderRealtimeService.emitCritical(
      io,
      "order.status.changed.v1",
      {
        orderId: order.id,
        previousStatus: null,
        currentStatus: ORDER_STATUS.PENDIENTE,
        reason: "CREATED",
        occurredAt: new Date().toISOString(),
        correlationId: `order-created-${order.id}`,
      },
    );

    const detail = await this.getOrderDetail({ orderId: order.id, actor });

    if (
      this.ordersEventPublisher &&
      typeof this.ordersEventPublisher.publishOrderCreated === "function"
    ) {
      try {
        await this.ordersEventPublisher.publishOrderCreated({
          orderDetail: detail,
          actor,
        });
      } catch (error) {
        logger.warn("orders.emqx.publish_failed", {
          orderId: order.id,
          message: error.message,
        });
      }
    }

    return detail;
  }

  async listOrders({ clienteId, page, pageSize, actor }) {
    this.assertClientOwnership({ actor, clienteId });
    return this.ordersRepository.listByClient(clienteId, page, pageSize);
  }

  async getOrderDetail({ orderId, actor }) {
    const order = await this.ordersRepository.getById(orderId);
    if (!order) {
      throw asOrderError("ORDER_NOT_FOUND");
    }

    this.assertOrderReadAccess({ actor, order });

    const lineas = await this.orderLinesRepository.listByOrder(orderId);
    const progress = this.buildProgress(lineas);

    return {
      order: this.mapOrder(order),
      progress,
      lineas: lineas.map((linea) => this.mapLine(linea)),
    };
  }

  async updateLineProgress({
    orderId,
    lineId,
    deltaProcesadas,
    deltaRechazadas,
    version,
    actor,
    io,
  }) {
    const order = await this.ordersRepository.getById(orderId);
    if (!order) {
      throw asOrderError("ORDER_NOT_FOUND");
    }
    this.assertOrderMutationAccess({ actor, order });
    if (order.estado === ORDER_STATUS.CANCELADO) {
      throw asOrderError("ORDER_CANCELED");
    }

    const line = await this.orderLinesRepository.getById(lineId);
    if (!line || Number(line.pedido_id) !== Number(orderId)) {
      throw asOrderError("ORDER_LINE_NOT_FOUND");
    }

    if (
      this.measurementProcessesRepository &&
      typeof this.measurementProcessesRepository.hasActiveByLine === "function"
    ) {
      const activeMeasurement =
        await this.measurementProcessesRepository.hasActiveByLine(lineId);
      if (activeMeasurement) {
        throw asOrderError("ORDER_LINE_MEASUREMENT_LOCKED");
      }
    }

    const updatedLine = await this.orderLinesRepository.updateProgress({
      lineId,
      deltaProcesadas,
      deltaRechazadas,
      expectedVersion: version,
    });

    if (!updatedLine) {
      throw asOrderError("ORDER_CONCURRENCY_CONFLICT");
    }

    await this.orderStateEventsRepository.record({
      orderId,
      lineId,
      eventType: "LINE_PROGRESS",
      actorType: actor && actor.role ? "USER" : "SYSTEM",
      actorId: actor && actor.sub ? String(actor.sub) : "system",
      payload: { deltaProcesadas, deltaRechazadas },
    });

    await this.recomputeAndPersistStatus({ orderId, io });

    await this.orderRealtimeService.emitCritical(
      io,
      "order.progress.updated.v1",
      {
        orderId,
        lineId,
        deltaProcesadas,
        deltaRechazadas,
        estadoPedido: (await this.ordersRepository.getById(orderId)).estado,
        occurredAt: new Date().toISOString(),
        correlationId: `order-progress-${orderId}-${lineId}-${Date.now()}`,
      },
    );

    const detail = await this.getOrderDetail({ orderId, actor });

    if (
      this.ordersEventPublisher &&
      typeof this.ordersEventPublisher.publishOrderProgress === "function"
    ) {
      try {
        await this.ordersEventPublisher.publishOrderProgress({
          orderDetail: detail,
          actor,
          reason: "line_progress_updated",
        });
      } catch (error) {
        logger.warn("orders.emqx.publish_failed", {
          orderId,
          message: error.message,
        });
      }
    }

    return detail;
  }

  async publishOrderProgress({ orderId, actor, reason }) {
    if (
      !this.ordersEventPublisher ||
      typeof this.ordersEventPublisher.publishOrderProgress !== "function"
    ) {
      return { ok: false, skipped: true, reason: "publisher_not_available" };
    }

    const detail = await this.getOrderDetail({ orderId, actor });

    try {
      await this.ordersEventPublisher.publishOrderProgress({
        orderDetail: detail,
        actor,
        reason,
      });
      return { ok: true };
    } catch (error) {
      logger.warn("orders.emqx.publish_failed", {
        orderId,
        message: error.message,
      });
      return { ok: false, error: error.message };
    }
  }

  async cancelLine({ orderId, lineId, actor, io }) {
    const order = await this.ordersRepository.getById(orderId);
    if (!order) {
      throw asOrderError("ORDER_NOT_FOUND");
    }
    this.assertOrderMutationAccess({ actor, order });
    if (order.estado === ORDER_STATUS.CANCELADO) {
      throw asOrderError("ORDER_CANCELED");
    }

    const line = await this.orderLinesRepository.getById(lineId);
    if (!line || Number(line.pedido_id) !== Number(orderId)) {
      throw asOrderError("ORDER_LINE_NOT_FOUND");
    }

    const updatedLine = await this.orderLinesRepository.cancelLine({ lineId });
    if (!updatedLine) {
      throw asOrderError("ORDER_LINE_NOT_FOUND");
    }

    await this.orderStateEventsRepository.record({
      orderId,
      lineId,
      eventType: "LINE_CANCELED",
      actorType: actor && actor.role ? "USER" : "SYSTEM",
      actorId: actor && actor.sub ? String(actor.sub) : "system",
      payload: {},
    });

    await this.recomputeAndPersistStatus({ orderId, io });

    const detail = await this.getOrderDetail({ orderId, actor });

    if (
      this.ordersEventPublisher &&
      typeof this.ordersEventPublisher.publishOrderProgress === "function"
    ) {
      try {
        await this.ordersEventPublisher.publishOrderProgress({
          orderDetail: detail,
          actor,
          reason: "line_canceled",
        });
      } catch (error) {
        logger.warn("orders.emqx.publish_failed", {
          orderId,
          message: error.message,
        });
      }
    }

    return detail;
  }

  async recomputeAndPersistStatus({ orderId, io }) {
    const current = await this.ordersRepository.getById(orderId);
    const lineas = await this.orderLinesRepository.listByOrder(orderId);
    const nextStatus = computeOrderStatus({
      currentStatus: current.estado,
      lineas,
    });

    if (nextStatus !== current.estado) {
      const updated = await this.ordersRepository.transitionStatus({
        orderId,
        status: nextStatus,
      });
      await this.orderStateEventsRepository.record({
        orderId,
        eventType: "STATUS_CHANGED",
        actorType: "SYSTEM",
        actorId: "system",
        payload: { from: current.estado, to: nextStatus },
      });

      await this.orderRealtimeService.emitCritical(
        io,
        "order.status.changed.v1",
        {
          orderId,
          previousStatus: current.estado,
          currentStatus: updated.estado,
          reason: "AUTO_RECOMPUTE",
          occurredAt: new Date().toISOString(),
          correlationId: `order-status-${orderId}-${Date.now()}`,
        },
      );
    }

    const progress = this.buildProgress(lineas);
    this.orderRealtimeService.emitInformative(io, "order.summary.updated.v1", {
      orderId,
      ...progress,
    });
  }

  buildProgress(lineas) {
    const totalLineas = lineas.length;
    const totalSolicitadas = lineas.reduce(
      (acc, l) => acc + Number(l.cantidad || 0),
      0,
    );
    const totalProcesadas = lineas.reduce(
      (acc, l) => acc + Number(l.procesadas || 0),
      0,
    );
    const totalRechazadas = lineas.reduce(
      (acc, l) => acc + Number(l.rechazadas || 0),
      0,
    );
    const totalCanceladas = lineas
      .filter((l) => l.estado_linea === "CANCELADA")
      .reduce(
        (acc, l) =>
          acc +
          Math.max(
            0,
            Number(l.cantidad || 0) -
              Number(l.procesadas || 0) -
              Number(l.rechazadas || 0),
          ),
        0,
      );

    const totalRestantes = Math.max(
      0,
      totalSolicitadas - totalProcesadas - totalRechazadas - totalCanceladas,
    );
    const porcentajeAvance =
      totalSolicitadas > 0
        ? Number(
            (
              ((totalProcesadas + totalRechazadas + totalCanceladas) /
                totalSolicitadas) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      totalLineas,
      totalSolicitadas,
      totalProcesadas,
      totalRechazadas,
      totalCanceladas,
      totalRestantes,
      porcentajeAvance,
    };
  }

  mapOrder(order) {
    return {
      id: order.id,
      clienteId: order.cliente_id,
      estado: order.estado,
      version: order.version,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  mapLine(linea) {
    return {
      id: linea.id,
      pedidoId: linea.pedido_id,
      modeloProductoId: linea.modelo_producto_id,
      cantidad: linea.cantidad,
      procesadas: linea.procesadas,
      rechazadas: linea.rechazadas,
      estadoLinea: linea.estado_linea,
      version: linea.version,
      createdAt: linea.created_at,
      updatedAt: linea.updated_at,
    };
  }

  assertClientOwnership({ actor, clienteId }) {
    if (!actor || actor.role !== "client") {
      return;
    }

    if (Number(actor.sub) !== Number(clienteId)) {
      throw asOrderError("ORDER_FORBIDDEN");
    }
  }

  assertOrderReadAccess({ actor, order }) {
    if (
      !actor ||
      actor.role === "admin" ||
      actor.role === "supervisor" ||
      actor.role === "operator"
    ) {
      return;
    }

    if (
      actor.role === "client" &&
      Number(actor.sub) === Number(order.cliente_id)
    ) {
      return;
    }

    throw asOrderError("ORDER_FORBIDDEN");
  }

  assertOrderMutationAccess({ actor, order }) {
    if (
      !actor ||
      actor.role === "admin" ||
      actor.role === "supervisor" ||
      actor.role === "operator"
    ) {
      return;
    }

    if (
      actor.role === "client" &&
      Number(actor.sub) === Number(order.cliente_id)
    ) {
      return;
    }

    throw asOrderError("ORDER_FORBIDDEN");
  }
}

module.exports = {
  OrdersService,
};
