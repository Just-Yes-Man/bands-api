const { clientSocketAuthMiddleware } = require('../middlewares/client-socket-auth-middleware');
const { registerAuthFailureHandler } = require('../handlers/auth-failure-handler');

const wireProtectedGateway = (namespace) => {
  namespace.use(clientSocketAuthMiddleware());

  namespace.on('connection', (socket) => {
    registerAuthFailureHandler(socket);
    socket.emit('auth.ready.v1', {
      ok: true,
      role: socket.authClient.role,
      username: socket.authClient.username
    });
  });
};

module.exports = {
  wireProtectedGateway
};
