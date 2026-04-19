const mockOrderGetById = jest.fn();
const mockProcessGetById = jest.fn();

jest.mock('../../../src/infrastructure/db/repositories/orders.repository', () => ({
  OrdersRepository: jest.fn().mockImplementation(() => ({
    getById: mockOrderGetById
  }))
}));

jest.mock('../../../src/infrastructure/db/repositories/measurement-processes.repository', () => ({
  MeasurementProcessesRepository: jest.fn().mockImplementation(() => ({
    getById: mockProcessGetById
  }))
}));

const {
  requireMeasurementRole,
  enforceMeasurementOwnershipByOrder,
  enforceMeasurementOwnershipByProcess
} = require('../../../src/api/http/v1/middlewares/measurement-auth');

describe('integration measurement auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requireMeasurementRole allows configured role by operation matrix', () => {
    const req = { user: { role: 'operator', sub: '7' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireMeasurementRole('admin', 'supervisor', 'operator', 'client')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('enforceMeasurementOwnershipByOrder blocks client accessing another client order', async () => {
    mockOrderGetById.mockResolvedValueOnce({ id: 22, cliente_id: 10 });

    const req = { user: { role: 'client', sub: '99' }, params: { orderId: '22' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await enforceMeasurementOwnershipByOrder(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('enforceMeasurementOwnershipByProcess allows client owning process order', async () => {
    mockProcessGetById.mockResolvedValueOnce({ id: 301, pedido_id: 45 });
    mockOrderGetById.mockResolvedValueOnce({ id: 45, cliente_id: 12 });

    const req = { user: { role: 'client', sub: '12' }, params: { processId: '301' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await enforceMeasurementOwnershipByProcess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
