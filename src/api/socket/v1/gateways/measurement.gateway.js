const registerMeasurementGateway = (namespace) => {
  namespace.on('connection', (socket) => {
    socket.on('measurement.subscribe.v1', (payload = {}) => {
      const processId = payload.processId ? Number(payload.processId) : null;
      if (processId && Number.isFinite(processId)) {
        socket.join(`measurement:process:${processId}`);
      }
      socket.emit('measurement.subscribed.v1', {
        ok: true,
        processId
      });
    });

    socket.on('measurement.unsubscribe.v1', (payload = {}) => {
      const processId = payload.processId ? Number(payload.processId) : null;
      if (processId && Number.isFinite(processId)) {
        socket.leave(`measurement:process:${processId}`);
      }
      socket.emit('measurement.unsubscribed.v1', {
        ok: true,
        processId
      });
    });
  });

  return namespace;
};

module.exports = {
  registerMeasurementGateway
};
