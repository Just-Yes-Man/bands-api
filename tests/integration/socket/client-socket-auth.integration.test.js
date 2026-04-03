const { clientSocketAuthMiddleware } = require('../../../src/api/socket/v1/middlewares/client-socket-auth-middleware');

describe('integration socket auth middleware', () => {
  test('rejects handshake without token', (done) => {
    const middleware = clientSocketAuthMiddleware();
    const socket = { handshake: { auth: {}, headers: {} } };

    middleware(socket, (error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('AUTH_UNAUTHORIZED');
      done();
    });
  });
});
