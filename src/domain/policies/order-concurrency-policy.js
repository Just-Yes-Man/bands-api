const assertExpectedVersion = (expected, actual) => {
  if (Number(expected) !== Number(actual)) {
    const error = new Error('ORDER_CONCURRENCY_CONFLICT');
    error.code = 'ORDER_CONCURRENCY_CONFLICT';
    error.statusCode = 409;
    throw error;
  }
};

module.exports = {
  assertExpectedVersion
};
