const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const buildSwaggerSpec = () => {
  const authContract = path.resolve(process.cwd(), 'specs/002-cliente-auth/contracts/auth-api.yaml');

  return swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Conveyor Backend API',
        version: '1.0.0'
      }
    },
    apis: [authContract]
  });
};

module.exports = {
  buildSwaggerSpec
};
