const { OrdersService } = require('../../../src/application/services/orders.service');

const buildService = ({ order }) => new OrdersService({
  ordersRepository: {
    getById: jest.fn().mockResolvedValue(order)
  },
  orderLinesRepository: {
    getById: jest.fn().mockResolvedValue({ id: 7, pedido_id: order.id, version: 1 }),
    updateProgress: jest.fn().mockResolvedValue({ id: 7, pedido_id: order.id }),
    cancelLine: jest.fn().mockResolvedValue({ id: 7, pedido_id: order.id }),
    listByOrder: jest.fn().mockResolvedValue([])
  },
  orderStateEventsRepository: {
    record: jest.fn().mockResolvedValue()
  },
  orderRealtimeService: {
    emitCritical: jest.fn().mockResolvedValue(),
    emitInformative: jest.fn()
  }
});

describe('orders service mutation access', () => {
  test('allows client to mutate own order line progress', async () => {
    const service = buildService({ order: { id: 22, cliente_id: 10, estado: 'PENDIENTE' } });

    await expect(service.updateLineProgress({
      orderId: 22,
      lineId: 7,
      deltaProcesadas: 1,
      deltaRechazadas: 0,
      version: 1,
      actor: { role: 'client', sub: '10' },
      io: null
    })).resolves.toBeDefined();
  });

  test('blocks client mutating another client order', async () => {
    const service = buildService({ order: { id: 22, cliente_id: 10, estado: 'PENDIENTE' } });

    await expect(service.cancelLine({
      orderId: 22,
      lineId: 7,
      actor: { role: 'client', sub: '99' },
      io: null
    })).rejects.toMatchObject({ code: 'ORDER_FORBIDDEN', statusCode: 403 });
  });
});
