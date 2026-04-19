const { MeasurementProcessesService } = require('../../../src/application/services/measurement-processes.service');

const buildService = () => {
  const measurementProcessesRepository = {
    create: jest.fn(),
    getById: jest.fn(),
    transitionState: jest.fn(),
    hasActiveByLine: jest.fn().mockResolvedValue(false),
    listByOrder: jest.fn()
  };

  const measurementProcessStateHistoryRepository = {
    record: jest.fn(),
    listByProcess: jest.fn().mockResolvedValue([])
  };

  const measurementsRepository = {
    listByProcess: jest.fn().mockResolvedValue([])
  };

  const ordersRepository = {
    getById: jest.fn()
  };

  const orderLinesRepository = {
    getById: jest.fn()
  };

  const measurementRealtimeService = {
    emitInformative: jest.fn(),
    emitCritical: jest.fn().mockResolvedValue({ delivered: true, attempts: 1 })
  };

  const service = new MeasurementProcessesService({
    measurementProcessesRepository,
    measurementProcessStateHistoryRepository,
    measurementsRepository,
    ordersRepository,
    orderLinesRepository,
    measurementRealtimeService
  });

  return {
    service,
    measurementProcessesRepository,
    measurementProcessStateHistoryRepository,
    ordersRepository,
    orderLinesRepository,
    measurementRealtimeService
  };
};

describe('integration measurement process lifecycle service', () => {
  test('creates process without lineaPedidoId and persists audit metadata in history', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementProcessStateHistoryRepository,
      ordersRepository,
      measurementRealtimeService
    } = buildService();

    ordersRepository.getById.mockResolvedValueOnce({ id: 22, cliente_id: 10, estado: 'PENDIENTE' });
    measurementProcessesRepository.create.mockResolvedValueOnce({
      id: 301,
      pedido_id: 22,
      linea_pedido_id: null,
      estado_actual: 'ESPERANDO',
      iniciado_en: null,
      finalizado_en: null,
      created_at: '2026-04-19T10:00:00.000Z',
      updated_at: '2026-04-19T10:00:00.000Z'
    });

    const created = await service.createProcess({
      orderId: 22,
      observacion: 'pedido level',
      actor: { role: 'client', sub: '10' },
      io: null
    });

    expect(created).toMatchObject({
      id: 301,
      pedidoId: 22,
      lineaPedidoId: null,
      estadoActual: 'ESPERANDO'
    });

    expect(measurementProcessStateHistoryRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        processId: 301,
        estado: 'ESPERANDO',
        actorRole: 'client',
        actorUserId: 10,
        actorClienteId: 10,
        observacion: 'pedido level'
      })
    );

    expect(measurementRealtimeService.emitInformative).toHaveBeenCalledWith(
      null,
      'measurement.process.started.v1',
      expect.objectContaining({ processId: 301, lineId: null })
    );
  });

  test('transitions process state and writes history entry with actor context', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementProcessStateHistoryRepository,
      ordersRepository,
      measurementRealtimeService
    } = buildService();

    measurementProcessesRepository.getById.mockResolvedValueOnce({
      id: 301,
      pedido_id: 22,
      linea_pedido_id: 9,
      estado_actual: 'ESPERANDO'
    });

    ordersRepository.getById.mockResolvedValueOnce({ id: 22, cliente_id: 10, estado: 'PENDIENTE' });

    measurementProcessesRepository.transitionState.mockResolvedValueOnce({
      id: 301,
      pedido_id: 22,
      linea_pedido_id: 9,
      estado_actual: 'EN_PROCESO',
      iniciado_en: '2026-04-19T10:05:00.000Z',
      finalizado_en: null,
      created_at: '2026-04-19T10:00:00.000Z',
      updated_at: '2026-04-19T10:05:00.000Z'
    });

    const updated = await service.transitionState({
      processId: 301,
      estado: 'EN_PROCESO',
      observacion: 'start line',
      actor: { role: 'operator', sub: '55' },
      io: null
    });

    expect(updated.estadoActual).toBe('EN_PROCESO');
    expect(measurementProcessStateHistoryRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        processId: 301,
        estado: 'EN_PROCESO',
        actorRole: 'operator',
        actorUserId: 55,
        observacion: 'start line'
      })
    );

    expect(measurementRealtimeService.emitCritical).toHaveBeenCalledWith(
      null,
      'measurement.process.state.changed.v1',
      expect.objectContaining({
        processId: 301,
        previousState: 'ESPERANDO',
        currentState: 'EN_PROCESO',
        lineId: 9
      })
    );
  });
});
