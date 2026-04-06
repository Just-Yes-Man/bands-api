class GetOrderDetailUseCase {
  constructor({ ordersService }) {
    this.ordersService = ordersService;
  }

  async execute(input) {
    return this.ordersService.getOrderDetail(input);
  }
}

module.exports = {
  GetOrderDetailUseCase
};
