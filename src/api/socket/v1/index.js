const { wireProtectedGateway } = require('./gateways/protected-gateway');
const { registerOrdersGateway } = require('./gateways/orders.gateway');

const registerClientProtectedGateway = (io) => {
  const namespace = io.of('/realtime/v1');
  wireProtectedGateway(namespace);
  registerOrdersGateway(namespace);
  return namespace;
};

module.exports = {
  registerClientProtectedGateway
};
