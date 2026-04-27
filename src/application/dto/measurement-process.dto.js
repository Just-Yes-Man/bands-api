const {
  createMeasurementProcessSchema,
  transitionProcessStateSchema,
  parseOrThrow
} = require('../../shared/contracts/measurement-schemas');

const parseCreateMeasurementProcessPayload = (payload) => {
  return parseOrThrow(createMeasurementProcessSchema, payload || {});
};

const parseTransitionMeasurementProcessPayload = (payload) => {
  return parseOrThrow(transitionProcessStateSchema, payload || {});
};

module.exports = {
  parseCreateMeasurementProcessPayload,
  parseTransitionMeasurementProcessPayload
};
