const express = require('express');

const { registerClient } = require('../controllers/client-auth-register-controller');
const { loginClient } = require('../controllers/client-auth-login-controller');

const router = express.Router();

router.post('/register', registerClient);
router.post('/login', loginClient);

module.exports = {
  clientAuthRoutes: router
};
