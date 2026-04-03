const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { buildSwaggerSpec } = require('../../../../infrastructure/config/swagger');

const router = express.Router();

const spec = buildSwaggerSpec();

router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

module.exports = {
  docsRoutes: router
};
