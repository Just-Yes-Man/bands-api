const { EmqxOrdersConsumer } = require('../../../src/infrastructure/messaging/emqx-orders.consumer');

const buildConsumer = () => {
  const ordersService = {
    applyExternalLineProgress: jest.fn()
  };
  const measurementCaptureService = {
    registerMeasurement: jest.fn()
  };
  const measurementProcessesService = {
    listProcessesByOrder: jest.fn(),
    createProcess: jest.fn()
  };

  return {
    consumer: new EmqxOrdersConsumer({
      ordersService,
      measurementCaptureService,
      measurementProcessesService
    }),
    ordersService,
    measurementCaptureService,
    measurementProcessesService
  };
};

describe('emqx orders consumer measurement errors', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('error topic only emits an error notice and does not mutate measurements', async () => {
    const { consumer, ordersService, measurementCaptureService } = buildConsumer();
    const emit = jest.fn();
    consumer.io = {
      of: jest.fn().mockReturnValue({ emit })
    };

    await consumer.handleMessage(
      'productos/mediciones/errores',
      Buffer.from(JSON.stringify({
        event: 'producto.medicion.error',
        source: 'emulador',
        pedidoId: 10,
        lineaPedidoId: 20,
        modeloProductoId: 30,
        reason: 'wrong_product',
        expected: { modeloProductoId: 30, qrOk: true },
        received: { modeloProductoId: 1030, qrOk: true },
        faultyIdempotencyKey: 'mqtt-10-20-fault-wrong-product',
        occurredAt: '2026-06-03T10:00:00.000Z'
      }))
    );

    expect(measurementCaptureService.registerMeasurement).not.toHaveBeenCalled();
    expect(ordersService.applyExternalLineProgress).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(
      'measurement.error.v1',
      {
        orderId: 10,
        lineId: 20,
        modeloProductoId: 30,
        reason: 'wrong_product',
        expected: { modeloProductoId: 30, qrOk: true },
        received: { modeloProductoId: 1030, qrOk: true },
        faultyIdempotencyKey: 'mqtt-10-20-fault-wrong-product',
        occurredAt: '2026-06-03T10:00:00.000Z'
      }
    );
  });

  test('measurement topic still registers valid measurement payloads', async () => {
    const {
      consumer,
      measurementCaptureService,
      measurementProcessesService
    } = buildConsumer();

    measurementProcessesService.listProcessesByOrder.mockResolvedValueOnce([
      { id: 99, lineaPedidoId: 20, estadoActual: 'EN_PROCESO' }
    ]);
    measurementCaptureService.registerMeasurement.mockResolvedValueOnce({});

    await consumer.handleMessage(
      'productos/mediciones',
      Buffer.from(JSON.stringify({
        event: 'producto.medicion',
        source: 'emulador',
        pedidoId: 10,
        lineaPedidoId: 20,
        modeloProductoId: 30,
        idempotencyKey: 'mqtt-10-20-ok',
        qrOk: true,
        pesoOk: true,
        colorOk: true,
        alturaOk: true
      }))
    );

    expect(measurementCaptureService.registerMeasurement).toHaveBeenCalledWith(
      expect.objectContaining({
        processId: 99,
        modeloProductoId: 30,
        idempotencyKey: 'mqtt-10-20-ok',
        applyProgress: false
      })
    );
  });
});
