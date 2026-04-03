const extractTokenFromAuthHeader = (authorization = '') => {
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.slice(7);
};

const extractClientToken = ({ headers = {}, handshake = {} }) => {
  const tokenFromHeader = extractTokenFromAuthHeader(headers.authorization || headers.Authorization || '');

  const tokenFromHandshakeAuth = handshake.auth && handshake.auth.token;
  const tokenFromHandshakeHeader = extractTokenFromAuthHeader(
    (handshake.headers && (handshake.headers.authorization || handshake.headers.Authorization)) || ''
  );

  return tokenFromHeader || tokenFromHandshakeAuth || tokenFromHandshakeHeader || null;
};

module.exports = {
  extractTokenFromAuthHeader,
  extractClientToken
};
