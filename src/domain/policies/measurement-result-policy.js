const MEASUREMENT_RESULTS = {
  PENDIENTE: 'PENDIENTE',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA'
};

const classifyMeasurementResult = ({ qrOk, pesoOk, colorOk, alturaOk }) => {
  const checks = [qrOk, pesoOk, colorOk, alturaOk];
  const hasFalse = checks.some((value) => value === false);
  if (hasFalse) {
    return MEASUREMENT_RESULTS.RECHAZADA;
  }

  const allTrue = checks.every((value) => value === true);
  if (allTrue) {
    return MEASUREMENT_RESULTS.APROBADA;
  }

  return MEASUREMENT_RESULTS.PENDIENTE;
};

module.exports = {
  MEASUREMENT_RESULTS,
  classifyMeasurementResult
};
