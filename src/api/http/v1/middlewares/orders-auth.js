const { asOrderError } = require('../../../../shared/errors/order-errors');

const requireOrdersRole = (...roles) => (req, res, next) => {
  const role = req.user && req.user.role;
  if (!role || (roles.length && !roles.includes(role))) {
    const error = asOrderError('ORDER_FORBIDDEN');
    return res.status(error.statusCode).json({ ok: false, error: { code: error.code, message: error.message } });
  }
  return next();
};

const enforceOrderOwnership = (req, res, next) => {
  const role = req.user && req.user.role;
  if (!req.user) {
    const error = asOrderError('ORDER_FORBIDDEN');
    return res.status(error.statusCode).json({ ok: false, error: { code: error.code, message: error.message } });
  }

  if (role === 'admin' || role === 'supervisor') {
    return next();
  }

  const queryClienteId = Number(req.query && req.query.clienteId);
  const tokenClientId = Number(req.user.sub);
  if (Number.isFinite(queryClienteId) && queryClienteId !== tokenClientId) {
    const error = asOrderError('ORDER_FORBIDDEN');
    return res.status(error.statusCode).json({ ok: false, error: { code: error.code, message: error.message } });
  }

  return next();
};

module.exports = {
  requireOrdersRole,
  enforceOrderOwnership
};
