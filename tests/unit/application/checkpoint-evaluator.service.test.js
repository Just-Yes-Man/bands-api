const { ProductCheckpointEvent } = require('../../../src/domain/entities/product-checkpoint-event.entity');

describe('checkpoint evaluator', () => {
  test('evaluates against model and marks approval', () => {
    const event = new ProductCheckpointEvent({
      measuredQr: 'QR-1',
      measuredWeight: 10,
      measuredColor: 'Rojo',
      measuredHeight: 5
    });

    event.evaluateAgainst({ expectedWeight: 10, expectedColor: 'rojo', expectedHeight: 5 });

    expect(event.approved).toBe(true);
    expect(event.status).toBe('reviewed');
  });
});
