const ORDER_ERRORS = {
  ORDER_NOT_FOUND: {
    code: "ORDER_NOT_FOUND",
    message: "Pedido no encontrado",
    statusCode: 404,
  },
  ORDER_FORBIDDEN: {
    code: "ORDER_FORBIDDEN",
    message: "No autorizado para este pedido",
    statusCode: 403,
  },
  ORDER_CANCELED: {
    code: "ORDER_CANCELED",
    message: "El pedido esta cancelado",
    statusCode: 409,
  },
  ORDER_LINE_NOT_FOUND: {
    code: "ORDER_LINE_NOT_FOUND",
    message: "Linea de pedido no encontrada",
    statusCode: 404,
  },
  ORDER_LINE_MEASUREMENT_LOCKED: {
    code: "ORDER_LINE_MEASUREMENT_LOCKED",
    message: "La linea tiene un proceso de medicion activo",
    statusCode: 409,
  },
  ORDER_CONCURRENCY_CONFLICT: {
    code: "ORDER_CONCURRENCY_CONFLICT",
    message: "Conflicto de concurrencia",
    statusCode: 409,
  },
  ORDER_COMPLETED: {
    code: "ORDER_COMPLETED",
    message: "El pedido ya esta completado",
    statusCode: 409,
  },
  ORDER_VALIDATION_ERROR: {
    code: "ORDER_VALIDATION_ERROR",
    message: "Payload invalido",
    statusCode: 400,
  },
};

const asOrderError = (key, details) => {
  const base = ORDER_ERRORS[key] || ORDER_ERRORS.ORDER_VALIDATION_ERROR;
  return {
    code: base.code,
    message: base.message,
    statusCode: base.statusCode,
    details,
  };
};

module.exports = {
  ORDER_ERRORS,
  asOrderError,
};
