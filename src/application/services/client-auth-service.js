const bcrypt = require('bcryptjs');

const { validatePasswordPolicy } = require('../../domain/policies/client-password-policy');
const { asHttpError } = require('../../shared/errors/auth-errors');

class ClientAuthService {
  constructor({ clientRepository, authAuditRepository, loginRateLimitStore, clientJwtService }) {
    this.clientRepository = clientRepository;
    this.authAuditRepository = authAuditRepository;
    this.loginRateLimitStore = loginRateLimitStore;
    this.clientJwtService = clientJwtService;
  }

  async register({ nombre, contrasena, ip }) {
    const passwordValidation = validatePasswordPolicy(contrasena);
    if (!passwordValidation.ok) {
      await this.authAuditRepository.record({
        eventType: 'register_failure',
        clientIdentifier: nombre,
        sourceIp: ip,
        outcome: 'failure',
        reasonCode: passwordValidation.code
      });
      throw asHttpError('VALIDATION_ERROR', [{ code: passwordValidation.code }]);
    }

    const existing = await this.clientRepository.findByNombre(nombre);
    if (existing) {
      await this.authAuditRepository.record({
        eventType: 'register_failure',
        clientIdentifier: nombre,
        sourceIp: ip,
        outcome: 'failure',
        reasonCode: 'DUPLICATE_CLIENT'
      });
      throw asHttpError('DUPLICATE_CLIENT');
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    const created = await this.clientRepository.create({ nombre, contrasenaHash });

    await this.authAuditRepository.record({
      eventType: 'register_success',
      clientIdentifier: nombre,
      sourceIp: ip,
      outcome: 'success',
      reasonCode: null
    });

    return created;
  }

  async login({ nombre, contrasena, ip }) {
    const rateWindow = this.loginRateLimitStore.consume(nombre, ip);
    if (!rateWindow.allowed) {
      await this.authAuditRepository.record({
        eventType: 'login_failure',
        clientIdentifier: nombre,
        sourceIp: ip,
        outcome: 'failure',
        reasonCode: 'RATE_LIMIT'
      });
      throw asHttpError('AUTH_RATE_LIMITED');
    }

    const client = await this.clientRepository.findByNombre(nombre);
    if (!client || !client.activo) {
      await this.authAuditRepository.record({
        eventType: 'login_failure',
        clientIdentifier: nombre,
        sourceIp: ip,
        outcome: 'failure',
        reasonCode: !client ? 'NOT_FOUND' : 'INACTIVE'
      });
      throw asHttpError('AUTH_FAILED');
    }

    const valid = await bcrypt.compare(contrasena, client.contrasena);
    if (!valid) {
      await this.authAuditRepository.record({
        eventType: 'login_failure',
        clientIdentifier: nombre,
        sourceIp: ip,
        outcome: 'failure',
        reasonCode: 'BAD_PASSWORD'
      });
      throw asHttpError('AUTH_FAILED');
    }

    this.loginRateLimitStore.reset(nombre, ip);

    const token = this.clientJwtService.issueToken(client);

    await this.authAuditRepository.record({
      eventType: 'login_success',
      clientIdentifier: nombre,
      sourceIp: ip,
      outcome: 'success',
      reasonCode: null
    });

    return {
      token,
      tokenType: 'Bearer',
      expiresIn: '1h'
    };
  }
}

module.exports = {
  ClientAuthService
};
