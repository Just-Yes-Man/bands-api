class ListOrdersUseCase {
  constructor({ ordersService }) {
    this.ordersService = ordersService;
  }

  async execute(input) {
    return this.ordersService.listOrders(input);
  }
}

module.exports = {
  ListOrdersUseCase
};
