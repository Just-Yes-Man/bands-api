class CancelOrderUseCase {
  constructor({ ordersService }) {
    this.ordersService = ordersService;
  }

  async execute(input) {
    return this.ordersService.cancelOrder(input);
  }
}

module.exports = {
  CancelOrderUseCase,
};
