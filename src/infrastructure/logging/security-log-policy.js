const redactAuthLogMeta = (meta = {}) => {
  const output = { ...meta };
  if (output.token) {
    output.token = '[REDACTED]';
  }
  if (output.contrasena) {
    output.contrasena = '[REDACTED]';
  }
  return output;
};

const redactOrderLogMeta = (meta = {}) => {
  const output = { ...meta };
  if (output.authorization) {
    output.authorization = '[REDACTED]';
  }
  if (output.token) {
    output.token = '[REDACTED]';
  }
  if (Array.isArray(output.lineas)) {
    output.lineas = `[REDACTED:${output.lineas.length}_lineas]`;
  }
  return output;
};

const redactMeasurementLogMeta = (meta = {}) => {
  const output = { ...meta };
  if (output.authorization) {
    output.authorization = '[REDACTED]';
  }
  if (output.token) {
    output.token = '[REDACTED]';
  }
  if (output.idempotencyKey) {
    output.idempotencyKey = '[REDACTED]';
  }
  if (output.correlationId) {
    output.correlationId = '[REDACTED]';
  }
  return output;
};

module.exports = {
  redactAuthLogMeta,
  redactOrderLogMeta,
  redactMeasurementLogMeta
};
