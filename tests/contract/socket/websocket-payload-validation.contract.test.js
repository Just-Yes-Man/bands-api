const { validatePayload } = require('../../../src/api/socket/v1/middlewares/payload-validator');

describe('websocket payload validation', () => {
  test('rejects invalid payload for checkpoint.register.v1', () => {
    const result = validatePayload('checkpoint.register.v1', { measuredQr: 'X' });
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });
});
