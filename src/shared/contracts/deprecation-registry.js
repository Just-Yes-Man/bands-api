const deprecations = {
  'legacy.socket.crear-modelo-producto': {
    replacement: 'product-model.create.v1',
    deprecatedAt: '2026-03-31'
  },
  'legacy.socket.registrar-paso-producto': {
    replacement: 'checkpoint.register.v1',
    deprecatedAt: '2026-03-31'
  }
};

module.exports = {
  deprecations
};
