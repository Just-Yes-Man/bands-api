const { requireOrdersRole, enforceOrderOwnership } = require('../../../src/api/http/v1/middlewares/orders-auth');

describe('orders auth middleware', () => {
  test('requireOrdersRole allows valid role', () => {
    const req = { user: { role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireOrdersRole('admin', 'supervisor')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('requireOrdersRole blocks invalid role', () => {
    const req = { user: { role: 'client' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireOrdersRole('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('enforceOrderOwnership blocks cross-client query', () => {
    const req = {
      user: { role: 'client', sub: '10' },
      query: { clienteId: '11' }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    enforceOrderOwnership(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('enforceOrderOwnership allows same client query', () => {
    const req = {
      user: { role: 'client', sub: '10' },
      query: { clienteId: '10' }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    enforceOrderOwnership(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
