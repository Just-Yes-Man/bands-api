const { canTransitionProcessState, isTerminalState } = require('../../domain/policies/measurement-process-state-policy');
const { asMeasurementError } = require('../../shared/errors/measurement-errors');

class MeasurementProcessesService {
  constructor({
    measurementProcessesRepository,
    measurementProcessStateHistoryRepository,
    measurementsRepository,
    ordersRepository,
    orderLinesRepository,
    measurementRealtimeService
  }) {
    this.measurementProcessesRepository = measurementProcessesRepository;
    this.measurementProcessStateHistoryRepository = measurementProcessStateHistoryRepository;
    this.measurementsRepository = measurementsRepository;
    this.ordersRepository = ordersRepository;
    this.orderLinesRepository = orderLinesRepository;
    this.measurementRealtimeService = measurementRealtimeService;
  }

  async createProcess({ orderId, lineaPedidoId = null, observacion, actor, io }) {
    const order = await this.ordersRepository.getById(orderId);
    if (!order) {
      throw asMeasurementError('PROCESS_ORDER_NOT_FOUND');
    }

    this.assertOrderMutationAccess({ actor, order });

    if (order.estado === 'CANCELADO' || order.estado === 'COMPLETADO') {
      throw asMeasurementError('PROCESS_ORDER_BLOCKED');
    }

    if (lineaPedidoId) {
      const line = await this.orderLinesRepository.getById(lineaPedidoId);
      if (!line || Number(line.pedido_id) !== Number(orderId)) {
        throw asMeasurementError('PROCESS_RELATION_INVALID');
      }
      if (line.estado_linea !== 'ACTIVA') {
        throw asMeasurementError('PROCESS_ORDER_BLOCKED');
      }

      const activeExists = await this.measurementProcessesRepository.hasActiveByLine(lineaPedidoId);
      if (activeExists) {
        throw asMeasurementError('PROCESS_LINE_LOCKED');
      }
    }

    const process = await this.measurementProcessesRepository.create({
      orderId,
      lineId: lineaPedidoId,
      estadoActual: 'ESPERANDO'
    });

    const context = this.buildActorContext(actor, `measurement-process-create-${process.id}`);
    await this.measurementProcessStateHistoryRepository.record({
      processId: process.id,
      estado: 'ESPERANDO',
      observacion,
      ...context
    });

    this.measurementRealtimeService.emitInformative(io, 'measurement.process.started.v1', {
      processId: process.id,
      orderId: Number(process.pedido_id),
      lineId: process.linea_pedido_id ? Number(process.linea_pedido_id) : null,
      startedAt: process.created_at
    });

    return this.mapProcess(process);
  }

  async transitionState({ processId, estado, observacion, actor, io }) {
    const process = await this.measurementProcessesRepository.getById(processId);
    if (!process) {
      throw asMeasurementError('PROCESS_NOT_FOUND');
    }

    const order = await this.ordersRepository.getById(process.pedido_id);
    this.assertOrderMutationAccess({ actor, order });

    if (isTerminalState(process.estado_actual)) {
      throw asMeasurementError('PROCESS_TERMINAL');
    }

    if (!canTransitionProcessState({ from: process.estado_actual, to: estado })) {
      throw asMeasurementError('PROCESS_INVALID_TRANSITION');
    }

    const transitioned = await this.measurementProcessesRepository.transitionState({
      processId,
      fromState: process.estado_actual,
      toState: estado
    });

    if (!transitioned) {
      throw asMeasurementError('PROCESS_INVALID_TRANSITION');
    }

    const context = this.buildActorContext(actor, `measurement-process-state-${processId}-${Date.now()}`);
    await this.measurementProcessStateHistoryRepository.record({
      processId,
      estado,
      observacion,
      ...context
    });

    await this.measurementRealtimeService.emitCritical(io, 'measurement.process.state.changed.v1', {
      processId: transitioned.id,
      orderId: Number(transitioned.pedido_id),
      lineId: transitioned.linea_pedido_id ? Number(transitioned.linea_pedido_id) : null,
      previousState: process.estado_actual,
      currentState: transitioned.estado_actual,
      occurredAt: new Date().toISOString(),
      correlationId: context.correlationId
    });

    return this.mapProcess(transitioned);
  }

  async listProcessesByOrder({ orderId, actor }) {
    const order = await this.ordersRepository.getById(orderId);
    if (!order) {
      throw asMeasurementError('PROCESS_ORDER_NOT_FOUND');
    }

    this.assertOrderReadAccess({ actor, order });

    const rows = await this.measurementProcessesRepository.listByOrder(orderId);
    return rows.map((row) => this.mapProcess(row));
  }

  async getProcessDetail({ processId, actor }) {
    const process = await this.measurementProcessesRepository.getById(processId);
    if (!process) {
      throw asMeasurementError('PROCESS_NOT_FOUND');
    }

    const order = await this.ordersRepository.getById(process.pedido_id);
    this.assertOrderReadAccess({ actor, order });

    const [historialEstados, mediciones] = await Promise.all([
      this.measurementProcessStateHistoryRepository.listByProcess(processId),
      this.measurementsRepository.listByProcess(processId)
    ]);

    return {
      process: this.mapProcess(process),
      historialEstados: historialEstados.map((entry) => ({
        id: Number(entry.id),
        estado: entry.estado,
        timestampEstado: entry.timestamp_estado,
        observacion: entry.observacion,
        actorRole: entry.actor_role,
        correlationId: entry.correlation_id
      })),
      mediciones: mediciones.map((measurement) => this.mapMeasurement(measurement))
    };
  }

  mapProcess(row) {
    return {
      id: Number(row.id),
      pedidoId: Number(row.pedido_id),
      lineaPedidoId: row.linea_pedido_id ? Number(row.linea_pedido_id) : null,
      estadoActual: row.estado_actual,
      iniciadoEn: row.iniciado_en,
      finalizadoEn: row.finalizado_en,
      createdAt: row.created_at,
      updatedAt: row.updated_at
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
      correlationId: row.correlation_id
    };
  }

  buildActorContext(actor, fallbackCorrelationId) {
    const actorRole = actor && actor.role ? actor.role : 'system';
    const actorUserId = actor && actor.sub && Number.isFinite(Number(actor.sub)) ? Number(actor.sub) : null;
    const actorClienteId = actorRole === 'client' ? actorUserId : null;

    return {
      actorUserId,
      actorRole,
      actorClienteId,
      correlationId: fallbackCorrelationId
    };
  }

  assertOrderReadAccess({ actor, order }) {
    if (!actor || actor.role === 'admin' || actor.role === 'supervisor' || actor.role === 'operator') {
      return;
    }

    if (actor.role === 'client' && Number(actor.sub) === Number(order.cliente_id)) {
      return;
    }

    throw asMeasurementError('PROCESS_FORBIDDEN');
  }

  assertOrderMutationAccess({ actor, order }) {
    if (!actor || actor.role === 'admin' || actor.role === 'supervisor' || actor.role === 'operator') {
      return;
    }

    if (actor.role === 'client' && Number(actor.sub) === Number(order.cliente_id)) {
      return;
    }

    throw asMeasurementError('PROCESS_FORBIDDEN');
  }
}

module.exports = {
  MeasurementProcessesService
};
