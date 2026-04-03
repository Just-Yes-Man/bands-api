const jwt = require('jsonwebtoken');

const env = require('../../../../infrastructure/config/env');

const authJwt = (req, res, next) => {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Token requerido' } });
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    });
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Token invalido' } });
  }
};

module.exports = {
  authJwt
};
