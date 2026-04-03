const AUTH_ERRORS = {
  AUTH_FAILED: {
    code: 'AUTH_FAILED',
    message: 'Credenciales invalidas',
    statusCode: 401
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_UNAUTHORIZED',
    message: 'Token requerido o invalido',
    statusCode: 401
  },
  AUTH_RATE_LIMITED: {
    code: 'AUTH_RATE_LIMITED',
    message: 'Demasiados intentos, intenta mas tarde',
    statusCode: 429
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Payload invalido',
    statusCode: 400
  },
  DUPLICATE_CLIENT: {
    code: 'DUPLICATE_CLIENT',
    message: 'El cliente ya existe',
    statusCode: 409
  }
};

const asHttpError = (key, details) => {
  const base = AUTH_ERRORS[key] || AUTH_ERRORS.AUTH_FAILED;
  return {
    code: base.code,
    message: base.message,
    statusCode: base.statusCode,
    details
  };
};

module.exports = {
  AUTH_ERRORS,
  asHttpError
};
