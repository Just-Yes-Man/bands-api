const { buildContainer } = require('../../../../infrastructure/config/container');
const { extractClientToken } = require('../../../../shared/auth/client-token-extractor');

const { clientJwtService } = buildContainer();

const clientSocketAuthMiddleware = () => (socket, next) => {
  const token = extractClientToken({ handshake: socket.handshake });

  if (!token) {
    return next(new Error('AUTH_UNAUTHORIZED'));
  }

  try {
    socket.authClient = clientJwtService.verifyToken(token);
    return next();
  } catch (error) {
    return next(new Error('AUTH_UNAUTHORIZED'));
  }
};

module.exports = {
  clientSocketAuthMiddleware
};
