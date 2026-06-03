const { MeasurementCaptureService } = require('../../../src/application/services/measurement-capture.service');

const buildService = () => {
  const measurementProcessesRepository = {
    getById: jest.fn()
  };
  const measurementsRepository = {
    findByIdempotencyKey: jest.fn(),
    create: jest.fn()
  };
  const ordersRepository = {
    getById: jest.fn()
  };
  const orderLinesRepository = {
    getById: jest.fn(),
    applyMeasurementProgress: jest.fn()
  };
  const measurementRealtimeService = {
    emitInformative: jest.fn(),
    emitCritical: jest.fn().mockResolvedValue({ delivered: true, attempts: 1 })
  };
  const ordersService = {
    recomputeAndPersistStatus: jest.fn().mockResolvedValue(undefined),
    publishOrderProgress: jest.fn().mockResolvedValue(undefined)
  };

  return {
    service: new MeasurementCaptureService({
      measurementProcessesRepository,
      measurementsRepository,
      ordersRepository,
      orderLinesRepository,
      measurementRealtimeService,
      ordersService
    }),
    measurementProcessesRepository,
    measurementsRepository,
    ordersRepository,
    orderLinesRepository,
    measurementRealtimeService,
    ordersService
  };
};

describe('integration measurement progress application', () => {
  test('register approved measurement and apply progress delta', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementsRepository,
      ordersRepository,
      orderLinesRepository,
      ordersService,
      measurementRealtimeService
    } = buildService();

    measurementProcessesRepository.getById.mockResolvedValueOnce({
      id: 44,
      pedido_id: 22,
      linea_pedido_id: 9,
      estado_actual: 'EN_PROCESO'
    });
    ordersRepository.getById.mockResolvedValueOnce({ id: 22, cliente_id: 10, estado: 'EN_PROCESO' });
    orderLinesRepository.getById.mockResolvedValueOnce({
      id: 9,
      pedido_id: 22,
      modelo_producto_id: 5
    });
    measurementsRepository.findByIdempotencyKey.mockResolvedValueOnce(null);
    measurementsRepository.create.mockResolvedValueOnce({
      id: 900,
      proceso_medicion_id: 44,
      modelo_producto_id: 5,
      qr_ok: true,
      peso_ok: true,
      color_ok: true,
      altura_ok: true,
      resultado_final: 'APROBADA',
      capturada_en: '2026-04-19T11:00:00.000Z',
      idempotency_key: 'station-1-run-42-sample-001',
      actor_role: 'operator',
      correlation_id: 'corr-1'
    });
    orderLinesRepository.applyMeasurementProgress.mockResolvedValueOnce({ id: 9, pedido_id: 22 });

    const result = await service.registerMeasurement({
      processId: 44,
      modeloProductoId: 5,
      idempotencyKey: 'station-1-run-42-sample-001',
      qrOk: true,
      pesoOk: true,
      colorOk: true,
      alturaOk: true,
      actor: { role: 'operator', sub: '88' },
      io: null
    });

    expect(result.duplicate).toBe(false);
    expect(result.progressApplied).toEqual({ deltaProcesadas: 1, deltaRechazadas: 0 });
    expect(orderLinesRepository.getById).toHaveBeenCalledWith(9);
    expect(orderLinesRepository.applyMeasurementProgress).toHaveBeenCalledWith({
      lineId: 9,
      deltaProcesadas: 1,
      deltaRechazadas: 0
    });
    expect(ordersService.recomputeAndPersistStatus).toHaveBeenCalledWith({ orderId: 22, io: null });
    expect(ordersService.publishOrderProgress).toHaveBeenCalledWith({
      orderId: 22,
      actor: { role: 'operator', sub: '88' },
      reason: 'measurement_applied'
    });
    expect(measurementRealtimeService.emitCritical).toHaveBeenCalledWith(
      null,
      'measurement.progress.applied.v1',
      expect.objectContaining({ processId: 44, deltaProcesadas: 1, lineId: 9 })
    );
  });

  test('persists measurement audit metadata fields from actor context', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementsRepository,
      ordersRepository,
      orderLinesRepository
    } = buildService();

    measurementProcessesRepository.getById.mockResolvedValueOnce({
      id: 55,
      pedido_id: 31,
      linea_pedido_id: null,
      estado_actual: 'EN_PROCESO'
    });
    ordersRepository.getById.mockResolvedValueOnce({ id: 31, cliente_id: 17, estado: 'EN_PROCESO' });
    measurementsRepository.findByIdempotencyKey.mockResolvedValueOnce(null);
    measurementsRepository.create.mockResolvedValueOnce({
      id: 901,
      proceso_medicion_id: 55,
      modelo_producto_id: 6,
      resultado_final: 'PENDIENTE',
      capturada_en: '2026-04-19T11:05:00.000Z',
      idempotency_key: 'station-1-run-43-sample-001',
      actor_role: 'client',
      correlation_id: 'corr-2'
    });

    await service.registerMeasurement({
      processId: 55,
      modeloProductoId: 6,
      idempotencyKey: 'station-1-run-43-sample-001',
      qrOk: true,
      actor: { role: 'client', sub: '17' },
      io: null
    });

    expect(measurementsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorRole: 'client',
        actorUserId: 17,
        actorClienteId: 17
      })
    );
    expect(orderLinesRepository.applyMeasurementProgress).not.toHaveBeenCalled();
  });

  test('rejects measurement when product model does not match order line', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementsRepository,
      ordersRepository,
      orderLinesRepository
    } = buildService();

    measurementProcessesRepository.getById.mockResolvedValueOnce({
      id: 66,
      pedido_id: 42,
      linea_pedido_id: 12,
      estado_actual: 'EN_PROCESO'
    });
    ordersRepository.getById.mockResolvedValueOnce({ id: 42, cliente_id: 10, estado: 'EN_PROCESO' });
    orderLinesRepository.getById.mockResolvedValueOnce({
      id: 12,
      pedido_id: 42,
      modelo_producto_id: 7
    });

    await expect(service.registerMeasurement({
      processId: 66,
      modeloProductoId: 8,
      idempotencyKey: 'station-1-run-44-sample-001',
      qrOk: true,
      pesoOk: true,
      colorOk: true,
      alturaOk: true,
      actor: { role: 'operator', sub: '88' },
      io: null
    })).rejects.toMatchObject({
      code: 'MEASUREMENT_PRODUCT_MISMATCH',
      details: {
        expectedModeloProductoId: 7,
        receivedModeloProductoId: 8,
        lineId: 12
      }
    });

    expect(measurementsRepository.findByIdempotencyKey).not.toHaveBeenCalled();
    expect(measurementsRepository.create).not.toHaveBeenCalled();
    expect(orderLinesRepository.applyMeasurementProgress).not.toHaveBeenCalled();
  });
});
