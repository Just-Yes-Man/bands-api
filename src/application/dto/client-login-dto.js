const { loginSchema, parseOrThrow } = require('../../shared/contracts/client-auth-schemas');

const parseLoginPayload = (body) => parseOrThrow(loginSchema, body);

module.exports = {
  parseLoginPayload
};
