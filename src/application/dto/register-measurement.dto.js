const { registerMeasurementSchema, parseOrThrow } = require('../../shared/contracts/measurement-schemas');

const parseRegisterMeasurementPayload = (payload) => {
  return parseOrThrow(registerMeasurementSchema, payload || {});
};

module.exports = {
  parseRegisterMeasurementPayload
};
