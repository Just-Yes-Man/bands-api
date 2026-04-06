class CancelOrderLineUseCase {
  constructor({ ordersService }) {
    this.ordersService = ordersService;
  }

  async execute(input) {
    return this.ordersService.cancelLine(input);
  }
}

module.exports = {
  CancelOrderLineUseCase
};
