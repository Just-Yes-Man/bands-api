const { validatePayload } = require('../middlewares/payload-validator');

const registerCommandHandlers = ({ socket, checkpointService, publisher }) => {
  socket.on('checkpoint.register.v1', async (payload, ack = () => {}) => {
    const valid = validatePayload('checkpoint.register.v1', payload);
    if (!valid.ok) {
      return ack({ ok: false, error: valid.error });
    }

    const result = await checkpointService.register(valid.value, socket.user || null);
    ack(result);

    if (result.ok) {
      await publisher.publish('checkpoint.reviewed.v1', result.data);
      socket.emit('state.metrics-updated.v1', {
        pendingCount: 0,
        latestReviews: [result.data]
      });
    }
  });

  socket.on('checkpoint.review-next.v1', async (payload, ack = () => {}) => {
    const valid = validatePayload('checkpoint.review-next.v1', payload);
    if (!valid.ok) {
      return ack({ ok: false, error: valid.error });
    }

    return ack({ ok: true, data: null });
  });
};

module.exports = {
  registerCommandHandlers
};
