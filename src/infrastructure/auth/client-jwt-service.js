const jwt = require('jsonwebtoken');
const env = require('../config/env');

const CLIENT_ROLE = 'client';

class ClientJwtService {
  issueToken(client) {
    return jwt.sign(
      {
        sub: String(client.id),
        username: client.nombre,
        role: CLIENT_ROLE
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
      }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    });
  }
}

module.exports = {
  ClientJwtService,
  CLIENT_ROLE
};
