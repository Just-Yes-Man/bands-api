class CreateOrderUseCase {
  constructor({ ordersService }) {
    this.ordersService = ordersService;
  }

  async execute(input) {
    return this.ordersService.createOrder(input);
  }
}

module.exports = {
  CreateOrderUseCase
};
