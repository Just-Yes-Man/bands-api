const { createOrderSchema, parseOrThrow } = require('../../shared/contracts/order-schemas');

const parseCreateOrderPayload = (body) => parseOrThrow(createOrderSchema, body);

module.exports = {
  parseCreateOrderPayload
};
