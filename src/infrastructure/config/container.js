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
const { EmqxOrdersPublisher } = require('../messaging/emqx-orders.publisher');
const { CreateOrderUseCase } = require('../../application/use-cases/create-order.use-case');
const { ListOrdersUseCase } = require('../../application/use-cases/list-orders.use-case');
const { GetOrderDetailUseCase } = require('../../application/use-cases/get-order-detail.use-case');
const { UpdateOrderLineProgressUseCase } = require('../../application/use-cases/update-order-line-progress.use-case');
const { CancelOrderLineUseCase } = require('../../application/use-cases/cancel-order-line.use-case');
const { MeasurementProcessesRepository } = require('../db/repositories/measurement-processes.repository');
const { MeasurementProcessStateHistoryRepository } = require('../db/repositories/measurement-process-state-history.repository');
const { MeasurementsRepository } = require('../db/repositories/measurements.repository');
const { MeasurementRealtimeService } = require('../../application/services/measurement-realtime.service');
const { MeasurementProcessesService } = require('../../application/services/measurement-processes.service');
const { MeasurementCaptureService } = require('../../application/services/measurement-capture.service');
const { CreateMeasurementProcessUseCase } = require('../../application/use-cases/create-measurement-process.use-case');
const { TransitionMeasurementProcessStateUseCase } = require('../../application/use-cases/transition-measurement-process-state.use-case');
const { RegisterMeasurementUseCase } = require('../../application/use-cases/register-measurement.use-case');
const { ListMeasurementProcessesUseCase } = require('../../application/use-cases/list-measurement-processes.use-case');
const { GetMeasurementProcessDetailUseCase } = require('../../application/use-cases/get-measurement-process-detail.use-case');

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
  const ordersEventPublisher = new EmqxOrdersPublisher();
  const measurementProcessesRepository = new MeasurementProcessesRepository();
  const measurementProcessStateHistoryRepository = new MeasurementProcessStateHistoryRepository();
  const measurementsRepository = new MeasurementsRepository();
  const measurementRealtimeService = new MeasurementRealtimeService();

  const ordersService = new OrdersService({
    ordersRepository,
    orderLinesRepository,
    orderStateEventsRepository,
    orderRealtimeService,
    ordersEventPublisher,
    measurementProcessesRepository
  });

  const measurementProcessesService = new MeasurementProcessesService({
    measurementProcessesRepository,
    measurementProcessStateHistoryRepository,
    measurementsRepository,
    ordersRepository,
    orderLinesRepository,
    measurementRealtimeService
  });

  const measurementCaptureService = new MeasurementCaptureService({
    measurementProcessesRepository,
    measurementsRepository,
    ordersRepository,
    orderLinesRepository,
    measurementRealtimeService,
    ordersService
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
    cancelOrderLineUseCase: new CancelOrderLineUseCase({ ordersService }),
    measurementProcessesService,
    measurementCaptureService,
    createMeasurementProcessUseCase: new CreateMeasurementProcessUseCase({ measurementProcessesService }),
    transitionMeasurementProcessStateUseCase: new TransitionMeasurementProcessStateUseCase({ measurementProcessesService }),
    registerMeasurementUseCase: new RegisterMeasurementUseCase({ measurementCaptureService }),
    listMeasurementProcessesUseCase: new ListMeasurementProcessesUseCase({ measurementProcessesService }),
    getMeasurementProcessDetailUseCase: new GetMeasurementProcessDetailUseCase({ measurementProcessesService })
  };
};

module.exports = {
  buildContainer
};
