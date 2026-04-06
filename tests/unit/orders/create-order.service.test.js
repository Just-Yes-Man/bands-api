const { OrdersService } = require('../../../src/application/services/orders.service');

describe('orders service create flow', () => {
  test('blocks client creating order for another client', async () => {
    const service = new OrdersService({
      ordersRepository: { createOrderHeader: jest.fn() },
      orderLinesRepository: { createMany: jest.fn() },
      orderStateEventsRepository: { record: jest.fn() },
      orderRealtimeService: { emitCritical: jest.fn(), emitInformative: jest.fn() }
    });

    await expect(
      service.createOrder({
        clienteId: 99,
        lineas: [{ modeloProductoId: 1, cantidad: 2 }],
        actor: { role: 'client', sub: '10' },
        io: null
      })
    ).rejects.toMatchObject({ code: 'ORDER_FORBIDDEN', statusCode: 403 });
  });
});
