const express = require('express');
const request = require('supertest');

const { clientAuthMiddleware } = require('../../../src/api/http/v1/middlewares/client-auth-middleware');

describe('integration protected client middleware', () => {
  test('rejects missing token', async () => {
    const app = express();
    app.get('/protected/me', clientAuthMiddleware, (req, res) => res.json({ ok: true }));

    const response = await request(app).get('/protected/me');
    expect(response.status).toBe(401);
    expect(response.body.ok).toBe(false);
  });
});
