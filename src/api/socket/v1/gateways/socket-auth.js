const jwt = require('jsonwebtoken');

const env = require('../../../../infrastructure/config/env');

const socketAuth = (...allowedRoles) => (socket, next) => {
  const authToken = socket.handshake.auth && socket.handshake.auth.token;
  const header = socket.handshake.headers && socket.handshake.headers.authorization;
  const tokenFromHeader = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = authToken || tokenFromHeader;

  if (!token) {
    return next(new Error('AUTH_UNAUTHORIZED'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    });

    if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
      return next(new Error('AUTH_FORBIDDEN'));
    }

    socket.user = payload;
    return next();
  } catch (error) {
    return next(new Error('AUTH_UNAUTHORIZED'));
  }
};

module.exports = {
  socketAuth
};
