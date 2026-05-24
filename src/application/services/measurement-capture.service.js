const {
  classifyMeasurementResult,
} = require("../../domain/policies/measurement-result-policy");
const {
  isValidIdempotencyKey,
  normalizeIdempotencyKey,
} = require("../../domain/policies/measurement-idempotency-policy");
const {
  isTerminalState,
} = require("../../domain/policies/measurement-process-state-policy");
const {
  asMeasurementError,
} = require("../../shared/errors/measurement-errors");

class MeasurementCaptureService {
  constructor({
    measurementProcessesRepository,
    measurementsRepository,
    ordersRepository,
    orderLinesRepository,
    measurementRealtimeService,
    ordersService,
  }) {
    this.measurementProcessesRepository = measurementProcessesRepository;
    this.measurementsRepository = measurementsRepository;
    this.ordersRepository = ordersRepository;
    this.orderLinesRepository = orderLinesRepository;
    this.measurementRealtimeService = measurementRealtimeService;
    this.ordersService = ordersService;
  }

  async registerMeasurement({
    processId,
    modeloProductoId,
    idempotencyKey,
    qrOk,
    pesoOk,
    colorOk,
    alturaOk,
    actor,
    io,
    applyProgress = true,
  }) {
    const process =
      await this.measurementProcessesRepository.getById(processId);
    if (!process) {
      throw asMeasurementError("PROCESS_NOT_FOUND");
    }

    const order = await this.ordersRepository.getById(process.pedido_id);
    if (!order) {
      throw asMeasurementError("PROCESS_ORDER_NOT_FOUND");
    }

    this.assertOrderMutationAccess({ actor, order });

    if (isTerminalState(process.estado_actual)) {
      throw asMeasurementError("PROCESS_TERMINAL");
    }

    const normalizedKey = normalizeIdempotencyKey(idempotencyKey);
    if (!isValidIdempotencyKey(normalizedKey)) {
      throw asMeasurementError("MEASUREMENT_IDEMPOTENCY_INVALID");
    }

    const existing = await this.measurementsRepository.findByIdempotencyKey({
      processId,
      idempotencyKey: normalizedKey,
    });

    if (existing) {
      return {
        measurement: this.mapMeasurement(existing),
        progressApplied: {
          deltaProcesadas: 0,
          deltaRechazadas: 0,
        },
        duplicate: true,
      };
    }

    const resultadoFinal = classifyMeasurementResult({
      qrOk,
      pesoOk,
      colorOk,
      alturaOk,
    });
    const context = this.buildActorContext(
      actor,
      `measurement-recorded-${processId}-${Date.now()}`,
    );

    const created = await this.measurementsRepository.create({
      processId,
      modeloProductoId,
      qrOk,
      pesoOk,
      colorOk,
      alturaOk,
      resultadoFinal,
      idempotencyKey: normalizedKey,
      ...context,
    });

    if (!created) {
      const duplicated = await this.measurementsRepository.findByIdempotencyKey(
        { processId, idempotencyKey: normalizedKey },
      );
      return {
        measurement: this.mapMeasurement(duplicated),
        progressApplied: {
          deltaProcesadas: 0,
          deltaRechazadas: 0,
        },
        duplicate: true,
      };
    }

    let deltaProcesadas = 0;
    let deltaRechazadas = 0;

    if (applyProgress) {
      if (process.linea_pedido_id && resultadoFinal === "APROBADA") {
        deltaProcesadas = 1;
      } else if (process.linea_pedido_id && resultadoFinal === "RECHAZADA") {
        deltaRechazadas = 1;
      }

      if (
        process.linea_pedido_id &&
        (deltaProcesadas > 0 || deltaRechazadas > 0)
      ) {
        const updatedLine =
          await this.orderLinesRepository.applyMeasurementProgress({
            lineId: Number(process.linea_pedido_id),
            deltaProcesadas,
            deltaRechazadas,
          });

        if (!updatedLine) {
          throw asMeasurementError("PROCESS_ORDER_BLOCKED");
        }

        await this.ordersService.recomputeAndPersistStatus({
          orderId: Number(process.pedido_id),
          io,
        });

        await this.ordersService.publishOrderProgress({
          orderId: Number(process.pedido_id),
          actor,
          reason: "measurement_applied",
        });
      }
    }

    this.measurementRealtimeService.emitInformative(
      io,
      "measurement.recorded.v1",
      {
        processId: Number(process.id),
        measurementId: Number(created.id),
        result: created.resultado_final,
        capturedAt: created.capturada_en,
      },
    );

    await this.measurementRealtimeService.emitCritical(
      io,
      "measurement.progress.applied.v1",
      {
        processId: Number(process.id),
        orderId: Number(process.pedido_id),
        lineId: process.linea_pedido_id
          ? Number(process.linea_pedido_id)
          : null,
        measurementId: Number(created.id),
        measurementResult: created.resultado_final,
        deltaProcesadas,
        deltaRechazadas,
        occurredAt: new Date().toISOString(),
        correlationId: context.correlationId,
      },
    );

    return {
      measurement: this.mapMeasurement(created),
      progressApplied: {
        deltaProcesadas,
        deltaRechazadas,
      },
      duplicate: false,
    };
  }

  mapMeasurement(row) {
    return {
      id: Number(row.id),
      procesoMedicionId: Number(row.proceso_medicion_id),
      modeloProductoId: Number(row.modelo_producto_id),
      qrOk: row.qr_ok,
      pesoOk: row.peso_ok,
      colorOk: row.color_ok,
      alturaOk: row.altura_ok,
      resultadoFinal: row.resultado_final,
      capturadaEn: row.capturada_en,
      idempotencyKey: row.idempotency_key,
      actorRole: row.actor_role,
      correlationId: row.correlation_id,
    };
  }

  buildActorContext(actor, fallbackCorrelationId) {
    const actorRole = actor?.role || "system";
    const actorUserId =
      actor?.sub && Number.isFinite(Number(actor.sub))
        ? Number(actor.sub)
        : null;
    const actorClienteId = actorRole === "client" ? actorUserId : null;

    return {
      actorUserId,
      actorRole,
      actorClienteId,
      correlationId: fallbackCorrelationId,
    };
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

    throw asMeasurementError("PROCESS_FORBIDDEN");
  }
}

module.exports = {
  MeasurementCaptureService,
};
