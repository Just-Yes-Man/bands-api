const express = require('express');
const request = require('supertest');

const mockCreateMeasurementProcessExecute = jest.fn();
const mockTransitionMeasurementProcessStateExecute = jest.fn();

jest.mock('../../../src/infrastructure/config/container', () => ({
  buildContainer: () => ({
    createMeasurementProcessUseCase: {
      execute: mockCreateMeasurementProcessExecute
    },
    transitionMeasurementProcessStateUseCase: {
      execute: mockTransitionMeasurementProcessStateExecute
    }
  })
}));

const { createMeasurementProcessController } = require('../../../src/api/http/v1/controllers/measurement-process-create.controller');
const { transitionMeasurementProcessStateController } = require('../../../src/api/http/v1/controllers/measurement-process-state.controller');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { role: 'operator', sub: '7' };
    next();
  });
  app.set('io', null);

  app.post('/api/v1/orders/:orderId/measurement-processes', createMeasurementProcessController);
  app.post('/api/v1/measurement-processes/:processId/state', transitionMeasurementProcessStateController);
  return app;
};

describe('contract measurement process lifecycle endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /orders/:orderId/measurement-processes accepts payload with lineaPedidoId', async () => {
    mockCreateMeasurementProcessExecute.mockResolvedValueOnce({
      id: 101,
      pedidoId: 22,
      lineaPedidoId: 9,
      estadoActual: 'ESPERANDO'
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/v1/orders/22/measurement-processes')
      .send({ lineaPedidoId: 9, observacion: 'inicio' });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toMatchObject({
      id: 101,
      pedidoId: 22,
      lineaPedidoId: 9,
      estadoActual: 'ESPERANDO'
    });
  });

  test('POST /orders/:orderId/measurement-processes accepts process without lineaPedidoId', async () => {
    mockCreateMeasurementProcessExecute.mockResolvedValueOnce({
      id: 102,
      pedidoId: 22,
      lineaPedidoId: null,
      estadoActual: 'ESPERANDO'
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/v1/orders/22/measurement-processes')
      .send({ observacion: 'pedido-level process' });

    expect(response.status).toBe(201);
    expect(response.body.data.lineaPedidoId).toBeNull();
    expect(mockCreateMeasurementProcessExecute).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 22, observacion: 'pedido-level process' })
    );
  });

  test('POST /measurement-processes/:processId/state transitions valid state', async () => {
    mockTransitionMeasurementProcessStateExecute.mockResolvedValueOnce({
      id: 101,
      pedidoId: 22,
      estadoActual: 'EN_PROCESO'
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/v1/measurement-processes/101/state')
      .send({ estado: 'EN_PROCESO', observacion: 'start' });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.estadoActual).toBe('EN_PROCESO');
  });

  test('POST /measurement-processes/:processId/state rejects invalid transition payload', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/api/v1/measurement-processes/101/state')
      .send({ estado: 'INVALIDO' });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error.code).toBe('MEASUREMENT_VALIDATION_ERROR');
  });
});
