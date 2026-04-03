const { buildContainer } = require('../../../../infrastructure/config/container');
const { extractTokenFromAuthHeader } = require('../../../../shared/auth/client-token-extractor');

const { clientJwtService } = buildContainer();

const clientAuthMiddleware = (req, res, next) => {
  const token = extractTokenFromAuthHeader(req.headers.authorization || '');
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Token requerido o invalido'
      }
    });
  }

  try {
    req.client = clientJwtService.verifyToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Token requerido o invalido'
      }
    });
  }
};

module.exports = {
  clientAuthMiddleware
};
