require('dotenv').config();

const { ApiServer } = require('./src/api/server');

const bootstrap = async () => {
    try {
        const server = new ApiServer();
        await server.listen();
    } catch (error) {
        console.error('No se pudo iniciar la aplicacion:', error.message);
        process.exit(1);
    }
};

bootstrap();
