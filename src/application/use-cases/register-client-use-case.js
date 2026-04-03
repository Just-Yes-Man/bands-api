class RegisterClientUseCase {
  constructor({ clientAuthService }) {
    this.clientAuthService = clientAuthService;
  }

  async execute(input) {
    return this.clientAuthService.register(input);
  }
}

module.exports = {
  RegisterClientUseCase
};
