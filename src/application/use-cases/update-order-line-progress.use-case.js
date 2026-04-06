class UpdateOrderLineProgressUseCase {
  constructor({ ordersService }) {
    this.ordersService = ordersService;
  }

  async execute(input) {
    return this.ordersService.updateLineProgress(input);
  }
}

module.exports = {
  UpdateOrderLineProgressUseCase
};
