const { extractClientToken } = require('../../../../shared/auth/client-token-extractor');
const { buildContainer } = require('../../../../infrastructure/config/container');

const { clientJwtService } = buildContainer();

const ordersSocketAuth = (...allowedRoles) => (socket, next) => {
  const token = extractClientToken({ handshake: socket.handshake });
  if (!token) {
    return next(new Error('AUTH_UNAUTHORIZED'));
  }

  try {
    const payload = clientJwtService.verifyToken(token);
    if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
      return next(new Error('AUTH_FORBIDDEN'));
    }
    socket.orderUser = payload;
    return next();
  } catch (error) {
    return next(new Error('AUTH_UNAUTHORIZED'));
  }
};

module.exports = {
  ordersSocketAuth
};
