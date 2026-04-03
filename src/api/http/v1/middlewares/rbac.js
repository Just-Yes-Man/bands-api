const rbac = (...allowedRoles) => (req, res, next) => {
  const role = req.user && req.user.role;

  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'AUTH_FORBIDDEN',
        message: 'No tienes permisos para esta operacion'
      }
    });
  }

  return next();
};

module.exports = {
  rbac
};
