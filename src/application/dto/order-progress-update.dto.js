const { lineProgressUpdateSchema, parseOrThrow } = require('../../shared/contracts/order-schemas');

const parseLineProgressUpdatePayload = (body) => parseOrThrow(lineProgressUpdateSchema, body);

module.exports = {
  parseLineProgressUpdatePayload
};
