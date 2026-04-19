const { OrdersService } = require('../../../src/application/services/orders.service');

describe('orders emqx publishing integration (service level)', () => {
  const buildDeps = ({ publisher }) => ({
    ordersRepository: {
      createOrderHeader: jest.fn().mockResolvedValue({
        id: 1,
        cliente_id: 10,
        estado: 'PENDIENTE',
        version: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }),
      getById: jest.fn().mockResolvedValue({
        id: 1,
        cliente_id: 10,
        estado: 'PENDIENTE',
        version: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      })
    },
    orderLinesRepository: {
      createMany: jest.fn().mockResolvedValue([{ id: 11 }]),
      listByOrder: jest.fn().mockResolvedValue([
        {
          id: 11,
          pedido_id: 1,
          modelo_producto_id: 3,
          cantidad: 5,
          procesadas: 0,
          rechazadas: 0,
          estado_linea: 'ACTIVA',
          version: 0,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z'
        }
      ])
    },
    orderStateEventsRepository: {
      record: jest.fn().mockResolvedValue()
    },
    orderRealtimeService: {
      emitCritical: jest.fn().mockResolvedValue(),
      emitInformative: jest.fn()
    },
    ordersEventPublisher: publisher
  });

  test('publishes order created event without breaking original flow', async () => {
    const publisher = {
      publishOrderCreated: jest.fn().mockResolvedValue({ ok: true })
    };

    const service = new OrdersService(buildDeps({ publisher }));

    const result = await service.createOrder({
      clienteId: 10,
      lineas: [{ modeloProductoId: 3, cantidad: 5 }],
      actor: { role: 'client', sub: '10' },
      io: null
    });

    expect(result.order.id).toBe(1);
    expect(publisher.publishOrderCreated).toHaveBeenCalledTimes(1);
  });

  test('does not fail create order when publisher throws', async () => {
    const publisher = {
      publishOrderCreated: jest.fn().mockRejectedValue(new Error('emqx down'))
    };

    const service = new OrdersService(buildDeps({ publisher }));

    await expect(service.createOrder({
      clienteId: 10,
      lineas: [{ modeloProductoId: 3, cantidad: 5 }],
      actor: { role: 'client', sub: '10' },
      io: null
    })).resolves.toMatchObject({
      order: { id: 1 }
    });
  });
});
