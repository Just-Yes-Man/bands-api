const {
  listMeasurementProcessesSchema,
  getMeasurementProcessDetailSchema,
  parseOrThrow
} = require('../../shared/contracts/measurement-schemas');

const parseListMeasurementProcessesQuery = (payload) => {
  return parseOrThrow(listMeasurementProcessesSchema, payload || {});
};

const parseMeasurementProcessDetailQuery = (payload) => {
  return parseOrThrow(getMeasurementProcessDetailSchema, payload || {});
};

module.exports = {
  parseListMeasurementProcessesQuery,
  parseMeasurementProcessDetailQuery
};
