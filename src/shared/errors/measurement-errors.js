const MEASUREMENT_ERRORS = {
  PROCESS_NOT_FOUND: { code: 'PROCESS_NOT_FOUND', message: 'Proceso de medicion no encontrado', statusCode: 404 },
  PROCESS_FORBIDDEN: { code: 'PROCESS_FORBIDDEN', message: 'No autorizado para este proceso', statusCode: 403 },
  PROCESS_INVALID_TRANSITION: { code: 'PROCESS_INVALID_TRANSITION', message: 'Transicion de estado invalida', statusCode: 409 },
  PROCESS_TERMINAL: { code: 'PROCESS_TERMINAL', message: 'El proceso ya se encuentra en estado terminal', statusCode: 409 },
  PROCESS_LINE_LOCKED: { code: 'PROCESS_LINE_LOCKED', message: 'Ya existe un proceso activo para esta linea', statusCode: 409 },
  PROCESS_RELATION_INVALID: { code: 'PROCESS_RELATION_INVALID', message: 'Relacion pedido-linea invalida', statusCode: 409 },
  PROCESS_ORDER_NOT_FOUND: { code: 'PROCESS_ORDER_NOT_FOUND', message: 'Pedido no encontrado', statusCode: 404 },
  PROCESS_ORDER_BLOCKED: { code: 'PROCESS_ORDER_BLOCKED', message: 'El pedido no permite actualizaciones por medicion', statusCode: 409 },
  PROCESS_LINE_NOT_FOUND: { code: 'PROCESS_LINE_NOT_FOUND', message: 'Linea de pedido no encontrada', statusCode: 404 },
  MEASUREMENT_PRODUCT_MISMATCH: { code: 'MEASUREMENT_PRODUCT_MISMATCH', message: 'El producto medido no coincide con la linea del pedido', statusCode: 409 },
  MEASUREMENT_DUPLICATE: { code: 'MEASUREMENT_DUPLICATE', message: 'Medicion duplicada por idempotency key', statusCode: 409 },
  MEASUREMENT_IDEMPOTENCY_INVALID: { code: 'MEASUREMENT_IDEMPOTENCY_INVALID', message: 'idempotencyKey invalida', statusCode: 400 },
  MEASUREMENT_VALIDATION_ERROR: { code: 'MEASUREMENT_VALIDATION_ERROR', message: 'Payload de medicion invalido', statusCode: 400 }
};

const asMeasurementError = (key, details) => {
  const base = MEASUREMENT_ERRORS[key] || MEASUREMENT_ERRORS.MEASUREMENT_VALIDATION_ERROR;
  return {
    code: base.code,
    message: base.message,
    statusCode: base.statusCode,
    details
  };
};

module.exports = {
  MEASUREMENT_ERRORS,
  asMeasurementError
};
