const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const { socketController } = require('../sockets/socketController');

class Server {

 constructor() {

  this.app = express();
  this.port = 1200;

  this.server = http.createServer(this.app);
  this.io = socketIO(this.server);

 }

 middlewares() {
  this.app.use(express.static('public'));
 }

 sockets() {
  this.io.on('connection', (socket) => {
   socketController(socket, this.io);
  });
 }

 listen() {

  this.middlewares();
  this.sockets();

  this.server.listen(this.port, () => {
   console.log("Servidor corriendo en puerto", this.port);
  });

 }

}

module.exports = Server;
