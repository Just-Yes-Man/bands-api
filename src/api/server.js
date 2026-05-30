const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const env = require("../infrastructure/config/env");
const { requestLogger, logger } = require("../infrastructure/logging/logger");
const { runMigrations } = require("../infrastructure/db/migrate");
const { v1Routes } = require("./http/v1/routes");
const { socketAuth } = require("./socket/v1/gateways/socket-auth");
const {
  emitInitialSnapshot,
} = require("./socket/v1/gateways/snapshot.gateway");
const { RealtimePublisher } = require("./socket/v1/events/publisher");
const {
  registerCommandHandlers,
} = require("./socket/v1/handlers/command.handlers");
const { registerClientProtectedGateway } = require("./socket/v1");
const {
  CheckpointService,
} = require("../application/services/checkpoint.service");
const { buildContainer } = require("../infrastructure/config/container");
const {
  EmqxOrdersConsumer,
} = require("../infrastructure/messaging/emqx-orders.consumer");

const { socketController } = require("../../sockets/socketController");

class ApiServer {
  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
      },
    });
    this.app.set("io", this.io);
    this.container = buildContainer();
    this.emqxConsumer = null;
  }

  middlewares() {
    this.app.use(express.json());
    this.app.use(requestLogger);

    if (env.ENABLE_LEGACY_API) {
      this.app.use(express.static("public"));
    }

    if (env.ENABLE_V1_API) {
      this.app.use("/api/v1", v1Routes);
    }
  }

  sockets() {
    const v1Namespace = this.io.of("/realtime/v1");
    v1Namespace.use(socketAuth("admin", "supervisor", "operator", "client"));

    v1Namespace.on("connection", (socket) => {
      emitInitialSnapshot(socket);
      const checkpointService = new CheckpointService();
      const publisher = new RealtimePublisher(v1Namespace);
      registerCommandHandlers({ socket, checkpointService, publisher });
    });

    registerClientProtectedGateway(this.io);

    if (env.ENABLE_LEGACY_API) {
      this.io.on("connection", (socket) => {
        socketController(socket, this.io);
      });
    }
  }

  async listen() {
    if (env.AUTO_MIGRATE) {
      await runMigrations();
    }

    this.middlewares();
    this.sockets();
    this.startMessagingConsumers();

    this.httpServer.listen(env.PORT, () => {
      logger.info("server.started", {
        port: env.PORT,
        enableV1Api: env.ENABLE_V1_API,
        enableLegacyApi: env.ENABLE_LEGACY_API,
      });
    });
  }

  startMessagingConsumers() {
    if (!env.EMQX_ENABLED) {
      return;
    }

    this.emqxConsumer = new EmqxOrdersConsumer({
      ordersService: this.container.ordersService,
      measurementCaptureService: this.container.measurementCaptureService,
      measurementProcessesService: this.container.measurementProcessesService,
    });

    this.emqxConsumer.start({ io: this.io });
  }
}

module.exports = {
  ApiServer,
};
