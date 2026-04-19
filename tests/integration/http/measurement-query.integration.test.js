const { MeasurementProcessesService } = require('../../../src/application/services/measurement-processes.service');

const buildService = () => {
  const measurementProcessesRepository = {
    getById: jest.fn(),
    listByOrder: jest.fn()
  };

  const measurementProcessStateHistoryRepository = {
    listByProcess: jest.fn()
  };

  const measurementsRepository = {
    listByProcess: jest.fn()
  };

  const ordersRepository = {
    getById: jest.fn()
  };

  const service = new MeasurementProcessesService({
    measurementProcessesRepository,
    measurementProcessStateHistoryRepository,
    measurementsRepository,
    ordersRepository,
    orderLinesRepository: { getById: jest.fn() },
    measurementRealtimeService: {
      emitInformative: jest.fn(),
      emitCritical: jest.fn().mockResolvedValue({ delivered: true, attempts: 1 })
    }
  });

  return {
    service,
    measurementProcessesRepository,
    measurementProcessStateHistoryRepository,
    measurementsRepository,
    ordersRepository
  };
};

describe('integration measurement query flows', () => {
  test('listProcessesByOrder returns mapped process list for allowed client ownership', async () => {
    const { service, ordersRepository, measurementProcessesRepository } = buildService();

    ordersRepository.getById.mockResolvedValueOnce({ id: 22, cliente_id: 10, estado: 'EN_PROCESO' });
    measurementProcessesRepository.listByOrder.mockResolvedValueOnce([
      {
        id: 401,
        pedido_id: 22,
        linea_pedido_id: null,
        estado_actual: 'ESPERANDO',
        iniciado_en: null,
        finalizado_en: null,
        created_at: '2026-04-19T12:00:00.000Z',
        updated_at: '2026-04-19T12:00:00.000Z'
      }
    ]);

    const data = await service.listProcessesByOrder({
      orderId: 22,
      actor: { role: 'client', sub: '10' }
    });

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ id: 401, pedidoId: 22, lineaPedidoId: null });
  });

  test('getProcessDetail aggregates process + history + measurements', async () => {
    const {
      service,
      measurementProcessesRepository,
      measurementProcessStateHistoryRepository,
      measurementsRepository,
      ordersRepository
    } = buildService();

    measurementProcessesRepository.getById.mockResolvedValueOnce({
      id: 501,
      pedido_id: 31,
      linea_pedido_id: 11,
      estado_actual: 'EN_PROCESO',
      iniciado_en: '2026-04-19T12:05:00.000Z',
      finalizado_en: null,
      created_at: '2026-04-19T12:00:00.000Z',
      updated_at: '2026-04-19T12:05:00.000Z'
    });
    ordersRepository.getById.mockResolvedValueOnce({ id: 31, cliente_id: 55, estado: 'EN_PROCESO' });
    measurementProcessStateHistoryRepository.listByProcess.mockResolvedValueOnce([
      {
        id: 1,
        estado: 'ESPERANDO',
        timestamp_estado: '2026-04-19T12:00:00.000Z',
        observacion: null,
        actor_role: 'operator',
        correlation_id: 'corr-1'
      }
    ]);
    measurementsRepository.listByProcess.mockResolvedValueOnce([
      {
        id: 901,
        proceso_medicion_id: 501,
        modelo_producto_id: 5,
        qr_ok: true,
        peso_ok: true,
        color_ok: true,
        altura_ok: true,
        resultado_final: 'APROBADA',
        capturada_en: '2026-04-19T12:10:00.000Z',
        idempotency_key: 'station-1-run-42-sample-001',
        actor_role: 'operator',
        correlation_id: 'corr-2'
      }
    ]);

    const data = await service.getProcessDetail({
      processId: 501,
      actor: { role: 'client', sub: '55' }
    });

    expect(data.process.id).toBe(501);
    expect(data.historialEstados).toHaveLength(1);
    expect(data.mediciones).toHaveLength(1);
    expect(data.mediciones[0].resultadoFinal).toBe('APROBADA');
  });
});
