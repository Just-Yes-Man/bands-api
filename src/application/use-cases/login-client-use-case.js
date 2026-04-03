class LoginClientUseCase {
  constructor({ clientAuthService }) {
    this.clientAuthService = clientAuthService;
  }

  async execute(input) {
    return this.clientAuthService.login(input);
  }
}

module.exports = {
  LoginClientUseCase
};
