const { wireProtectedGateway } = require('./gateways/protected-gateway');

const registerClientProtectedGateway = (io) => {
  const namespace = io.of('/realtime/v1');
  wireProtectedGateway(namespace);
  return namespace;
};

module.exports = {
  registerClientProtectedGateway
};
