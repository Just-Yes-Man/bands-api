require('dotenv').config();

const Server = require('./server/server');
const { initDatabase } = require('./db/initDatabase');

const bootstrap = async () => {
 try {
  await initDatabase();

  const server = new Server();
  server.listen();
 } catch (error) {
  console.error('No se pudo inicializar la base de datos:', error.message);
  process.exit(1);
 }
};

bootstrap();
