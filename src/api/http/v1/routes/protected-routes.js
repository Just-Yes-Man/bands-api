const express = require('express');
const { clientAuthMiddleware } = require('../middlewares/client-auth-middleware');

const router = express.Router();

router.get('/me', clientAuthMiddleware, (req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      id: req.client.sub,
      nombre: req.client.username,
      role: req.client.role
    }
  });
});

module.exports = {
  protectedRoutes: router
};
