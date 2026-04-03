const { registerSchema, parseOrThrow } = require('../../shared/contracts/client-auth-schemas');

const parseRegisterPayload = (body) => parseOrThrow(registerSchema, body);

module.exports = {
  parseRegisterPayload
};
