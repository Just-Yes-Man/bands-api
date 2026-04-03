const { ClientAuthRepository } = require('../db/repositories/client-auth-repository');
const { AuthAuditRepository } = require('../db/repositories/auth-audit-repository');
const { LoginRateLimitStore } = require('../auth/login-rate-limit-store');
const { ClientJwtService } = require('../auth/client-jwt-service');
const { ClientAuthService } = require('../../application/services/client-auth-service');
const { RegisterClientUseCase } = require('../../application/use-cases/register-client-use-case');
const { LoginClientUseCase } = require('../../application/use-cases/login-client-use-case');

const buildContainer = () => {
  const clientRepository = new ClientAuthRepository();
  const authAuditRepository = new AuthAuditRepository();
  const loginRateLimitStore = new LoginRateLimitStore();
  const clientJwtService = new ClientJwtService();

  const clientAuthService = new ClientAuthService({
    clientRepository,
    authAuditRepository,
    loginRateLimitStore,
    clientJwtService
  });

  return {
    clientAuthService,
    registerClientUseCase: new RegisterClientUseCase({ clientAuthService }),
    loginClientUseCase: new LoginClientUseCase({ clientAuthService }),
    clientJwtService
  };
};

module.exports = {
  buildContainer
};
