const IDEMPOTENCY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{5,119}$/;

const normalizeIdempotencyKey = (value) => {
  return String(value || '').trim();
};

const isValidIdempotencyKey = (value) => {
  const normalized = normalizeIdempotencyKey(value);
  return IDEMPOTENCY_PATTERN.test(normalized);
};

module.exports = {
  IDEMPOTENCY_PATTERN,
  normalizeIdempotencyKey,
  isValidIdempotencyKey
};
