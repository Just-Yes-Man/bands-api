const { queryOrdersSchema, parseOrThrow } = require('../../shared/contracts/order-schemas');

const parseQueryOrders = (query) => parseOrThrow(queryOrdersSchema, query);

module.exports = {
  parseQueryOrders
};
