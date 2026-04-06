const { computeOrderStatus, ORDER_STATUS } = require('../../../src/domain/policies/order-state-policy');

describe('order state policy', () => {
  test('returns EN_PROCESO when at least one line has progress', () => {
    const status = computeOrderStatus({
      currentStatus: ORDER_STATUS.PENDIENTE,
      lineas: [
        { estado_linea: 'ACTIVA', procesadas: 1, rechazadas: 0 },
        { estado_linea: 'ACTIVA', procesadas: 0, rechazadas: 0 }
      ]
    });

    expect(status).toBe(ORDER_STATUS.EN_PROCESO);
  });

  test('returns COMPLETADO when all lines are closed/cancelled', () => {
    const status = computeOrderStatus({
      currentStatus: ORDER_STATUS.EN_PROCESO,
      lineas: [
        { estado_linea: 'CERRADA', procesadas: 3, rechazadas: 0 },
        { estado_linea: 'CANCELADA', procesadas: 0, rechazadas: 0 }
      ]
    });

    expect(status).toBe(ORDER_STATUS.COMPLETADO);
  });

  test('returns CANCELADO when all lines are cancelled', () => {
    const status = computeOrderStatus({
      currentStatus: ORDER_STATUS.PENDIENTE,
      lineas: [
        { estado_linea: 'CANCELADA', procesadas: 0, rechazadas: 0 },
        { estado_linea: 'CANCELADA', procesadas: 0, rechazadas: 0 }
      ]
    });

    expect(status).toBe(ORDER_STATUS.CANCELADO);
  });
});
