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

module.exports = {
  redactAuthLogMeta
};
