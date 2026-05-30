const express = require('express');
const request = require('supertest');

const mockRegisterMeasurementExecute = jest.fn();

jest.mock('../../../src/infrastructure/config/container', () => ({
  buildContainer: () => ({
    registerMeasurementUseCase: {
      execute: mockRegisterMeasurementExecute
    }
  })
}));

const { registerMeasurementController } = require('../../../src/api/http/v1/controllers/measurement-register.controller');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { role: 'operator', sub: '7' };
    next();
  });
  app.set('io', null);
  app.post('/api/v1/measurement-processes/:processId/measurements', registerMeasurementController);
  return app;
};

describe('contract measurement register endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 201 for valid measurement payload', async () => {
    mockRegisterMeasurementExecute.mockResolvedValueOnce({
      measurement: {
        id: 77,
        resultadoFinal: 'APROBADA',
        idempotencyKey: 'station-1-run-42-sample-001'
      },
      progressApplied: { deltaProcesadas: 1, deltaRechazadas: 0 },
      duplicate: false
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/v1/measurement-processes/11/measurements')
      .send({
        modeloProductoId: 5,
        idempotencyKey: 'station-1-run-42-sample-001',
        qrOk: true,
        pesoOk: true,
        colorOk: true,
        alturaOk: true
      });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.measurement.resultadoFinal).toBe('APROBADA');
  });

  test('returns 400 for malformed idempotencyKey', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/api/v1/measurement-processes/11/measurements')
      .send({
        modeloProductoId: 5,
        idempotencyKey: 'bad key'
      });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error.code).toBe('MEASUREMENT_VALIDATION_ERROR');
  });

  test('returns 409 for duplicate/idempotency conflict', async () => {
    mockRegisterMeasurementExecute.mockRejectedValueOnce({
      statusCode: 409,
      code: 'MEASUREMENT_DUPLICATE',
      message: 'Medicion duplicada por idempotency key'
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/v1/measurement-processes/11/measurements')
      .send({
        modeloProductoId: 5,
        idempotencyKey: 'station-1-run-42-sample-001'
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('MEASUREMENT_DUPLICATE');
  });
});
