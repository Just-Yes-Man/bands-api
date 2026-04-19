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
    applyMeasurementProgress: jest.fn()
  };
  const measurementRealtimeService = {
    emitInformative: jest.fn(),
    emitCritical: jest.fn().mockResolvedValue({ delivered: true, attempts: 1 })
  };
  const ordersService = {
    recomputeAndPersistStatus: jest.fn().mockResolvedValue(undefined)
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
    ordersService
  };
};

describe('integration measurement idempotency behavior', () => {
  test('duplicate idempotency key does not apply progress twice', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementsRepository,
      ordersRepository,
      orderLinesRepository,
      ordersService
    } = buildService();

    measurementProcessesRepository.getById.mockResolvedValueOnce({
      id: 44,
      pedido_id: 22,
      linea_pedido_id: 9,
      estado_actual: 'EN_PROCESO'
    });
    ordersRepository.getById.mockResolvedValueOnce({ id: 22, cliente_id: 10, estado: 'EN_PROCESO' });
    measurementsRepository.findByIdempotencyKey.mockResolvedValueOnce({
      id: 777,
      proceso_medicion_id: 44,
      modelo_producto_id: 5,
      resultado_final: 'APROBADA',
      capturada_en: '2026-04-19T11:30:00.000Z',
      idempotency_key: 'station-1-run-42-sample-001',
      actor_role: 'operator',
      correlation_id: 'corr-existing'
    });

    const result = await service.registerMeasurement({
      processId: 44,
      modeloProductoId: 5,
      idempotencyKey: 'station-1-run-42-sample-001',
      actor: { role: 'operator', sub: '88' },
      io: null
    });

    expect(result.duplicate).toBe(true);
    expect(result.progressApplied).toEqual({ deltaProcesadas: 0, deltaRechazadas: 0 });
    expect(orderLinesRepository.applyMeasurementProgress).not.toHaveBeenCalled();
    expect(ordersService.recomputeAndPersistStatus).not.toHaveBeenCalled();
  });

  test('malformed idempotency key is rejected and measurement is not persisted', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementsRepository,
      ordersRepository
    } = buildService();

    measurementProcessesRepository.getById.mockResolvedValueOnce({
      id: 44,
      pedido_id: 22,
      linea_pedido_id: 9,
      estado_actual: 'EN_PROCESO'
    });
    ordersRepository.getById.mockResolvedValueOnce({ id: 22, cliente_id: 10, estado: 'EN_PROCESO' });

    await expect(service.registerMeasurement({
      processId: 44,
      modeloProductoId: 5,
      idempotencyKey: 'bad key',
      actor: { role: 'operator', sub: '88' },
      io: null
    })).rejects.toMatchObject({ code: 'MEASUREMENT_IDEMPOTENCY_INVALID', statusCode: 400 });

    expect(measurementsRepository.create).not.toHaveBeenCalled();
  });
});
