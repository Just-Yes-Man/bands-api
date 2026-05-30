const { OrdersService } = require('../../../src/application/services/orders.service');

describe('integration manual progress lock with active measurement process', () => {
  test('blocks manual line progress when active measurement process exists', async () => {
    const ordersService = new OrdersService({
      ordersRepository: {
        getById: jest.fn().mockResolvedValue({ id: 22, cliente_id: 10, estado: 'EN_PROCESO' }),
        updateAggregateFromLines: jest.fn(),
        updateStatusAndVersion: jest.fn()
      },
      orderLinesRepository: {
        getById: jest.fn().mockResolvedValue({ id: 9, pedido_id: 22, version: 1 }),
        updateProgress: jest.fn(),
        listByOrder: jest.fn().mockResolvedValue([]),
        cancelLine: jest.fn()
      },
      orderStateEventsRepository: {
        record: jest.fn()
      },
      orderRealtimeService: {
        emitCritical: jest.fn().mockResolvedValue({ delivered: true, attempts: 1 }),
        emitInformative: jest.fn()
      },
      measurementProcessesRepository: {
        hasActiveByLine: jest.fn().mockResolvedValue(true)
      }
    });

    await expect(ordersService.updateLineProgress({
      orderId: 22,
      lineId: 9,
      deltaProcesadas: 1,
      deltaRechazadas: 0,
      version: 1,
      actor: { role: 'operator', sub: '88' },
      io: null
    })).rejects.toMatchObject({ code: 'ORDER_LINE_MEASUREMENT_LOCKED', statusCode: 409 });
  });
});
