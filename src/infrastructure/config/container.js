const { ClientAuthRepository } = require('../db/repositories/client-auth-repository');
const { AuthAuditRepository } = require('../db/repositories/auth-audit-repository');
const { LoginRateLimitStore } = require('../auth/login-rate-limit-store');
const { ClientJwtService } = require('../auth/client-jwt-service');
const { ClientAuthService } = require('../../application/services/client-auth-service');
const { RegisterClientUseCase } = require('../../application/use-cases/register-client-use-case');
const { LoginClientUseCase } = require('../../application/use-cases/login-client-use-case');
const { OrdersRepository } = require('../db/repositories/orders.repository');
const { OrderLinesRepository } = require('../db/repositories/order-lines.repository');
const { OrderStateEventsRepository } = require('../db/repositories/order-state-events.repository');
const { OrderRealtimeService } = require('../../application/services/order-realtime.service');
const { OrdersService } = require('../../application/services/orders.service');
const { CreateOrderUseCase } = require('../../application/use-cases/create-order.use-case');
const { ListOrdersUseCase } = require('../../application/use-cases/list-orders.use-case');
const { GetOrderDetailUseCase } = require('../../application/use-cases/get-order-detail.use-case');
const { UpdateOrderLineProgressUseCase } = require('../../application/use-cases/update-order-line-progress.use-case');
const { CancelOrderLineUseCase } = require('../../application/use-cases/cancel-order-line.use-case');

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

  const ordersRepository = new OrdersRepository();
  const orderLinesRepository = new OrderLinesRepository();
  const orderStateEventsRepository = new OrderStateEventsRepository();
  const orderRealtimeService = new OrderRealtimeService();

  const ordersService = new OrdersService({
    ordersRepository,
    orderLinesRepository,
    orderStateEventsRepository,
    orderRealtimeService
  });

  return {
    clientAuthService,
    registerClientUseCase: new RegisterClientUseCase({ clientAuthService }),
    loginClientUseCase: new LoginClientUseCase({ clientAuthService }),
    clientJwtService,
    ordersService,
    createOrderUseCase: new CreateOrderUseCase({ ordersService }),
    listOrdersUseCase: new ListOrdersUseCase({ ordersService }),
    getOrderDetailUseCase: new GetOrderDetailUseCase({ ordersService }),
    updateOrderLineProgressUseCase: new UpdateOrderLineProgressUseCase({ ordersService }),
    cancelOrderLineUseCase: new CancelOrderLineUseCase({ ordersService })
  };
};

module.exports = {
  buildContainer
};
