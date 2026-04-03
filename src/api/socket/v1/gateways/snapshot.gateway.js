const emitInitialSnapshot = (socket) => {
  socket.emit('state.snapshot.v1', {
    activeMonitors: [],
    pendingCount: 0,
    latestReviews: []
  });
};

module.exports = {
  emitInitialSnapshot
};
