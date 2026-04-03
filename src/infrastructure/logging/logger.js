const { randomUUID } = require('crypto');

const write = (level, message, meta = {}) => {
  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    ...meta
  };
  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
};

const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};

const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const started = Date.now();
  res.on('finish', () => {
    logger.info('http.request.completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - started
    });
  });

  next();
};

module.exports = {
  logger,
  requestLogger
};
