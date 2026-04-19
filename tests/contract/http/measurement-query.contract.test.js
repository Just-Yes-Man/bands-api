const express = require('express');
const request = require('supertest');

const mockListMeasurementProcessesExecute = jest.fn();
const mockGetMeasurementProcessDetailExecute = jest.fn();

jest.mock('../../../src/infrastructure/config/container', () => ({
  buildContainer: () => ({
    listMeasurementProcessesUseCase: {
      execute: mockListMeasurementProcessesExecute
    },
    getMeasurementProcessDetailUseCase: {
      execute: mockGetMeasurementProcessDetailExecute
    }
  })
}));

const { listMeasurementProcessesController } = require('../../../src/api/http/v1/controllers/measurement-process-list.controller');
const { getMeasurementProcessDetailController } = require('../../../src/api/http/v1/controllers/measurement-process-detail.controller');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { role: 'operator', sub: '7' };
    next();
  });

  app.get('/api/v1/orders/:orderId/measurement-processes', listMeasurementProcessesController);
  app.get('/api/v1/measurement-processes/:processId', getMeasurementProcessDetailController);
  return app;
};

describe('contract measurement query endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /orders/:orderId/measurement-processes returns process list', async () => {
    mockListMeasurementProcessesExecute.mockResolvedValueOnce([
      { id: 1, pedidoId: 22, lineaPedidoId: null, estadoActual: 'ESPERANDO' }
    ]);

    const app = buildApp();
    const response = await request(app).get('/api/v1/orders/22/measurement-processes');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  test('GET /measurement-processes/:processId returns detail aggregate', async () => {
    mockGetMeasurementProcessDetailExecute.mockResolvedValueOnce({
      process: { id: 1, pedidoId: 22, estadoActual: 'EN_PROCESO' },
      historialEstados: [{ id: 1, estado: 'ESPERANDO' }],
      mediciones: []
    });

    const app = buildApp();
    const response = await request(app).get('/api/v1/measurement-processes/1');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toMatchObject({
      process: { id: 1, estadoActual: 'EN_PROCESO' }
    });
  });

  test('GET /measurement-processes/:processId rejects invalid process id format', async () => {
    const app = buildApp();
    const response = await request(app).get('/api/v1/measurement-processes/bad-id');

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error.code).toBe('MEASUREMENT_VALIDATION_ERROR');
  });
});
