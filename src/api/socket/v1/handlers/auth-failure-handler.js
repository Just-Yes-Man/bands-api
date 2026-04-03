const registerAuthFailureHandler = (socket) => {
  socket.on('error', () => {
    // Keep client-facing semantics generic by contract.
  });
};

module.exports = {
  registerAuthFailureHandler
};
