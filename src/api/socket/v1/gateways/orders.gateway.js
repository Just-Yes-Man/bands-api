const registerOrdersGateway = (namespace) => {
  namespace.on('connection', (socket) => {
    socket.on('orders.subscribe.v1', () => {
      socket.emit('orders.subscribed.v1', { ok: true });
    });
  });

  return namespace;
};

module.exports = {
  registerOrdersGateway
};
