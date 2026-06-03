const estado = document.querySelector("#estado");
const TOKEN_KEY = "bands_api_token";

const ui = {
  registerNombre: document.querySelector("#registerNombre"),
  registerContrasena: document.querySelector("#registerContrasena"),
  loginNombre: document.querySelector("#loginNombre"),
  loginContrasena: document.querySelector("#loginContrasena"),
  createClienteId: document.querySelector("#createClienteId"),
  createLineas: document.querySelector("#createLineas"),
  listClienteId: document.querySelector("#listClienteId"),
  orderId: document.querySelector("#orderId"),
  lineId: document.querySelector("#lineId"),
  lineasDisponibles: document.querySelector("#lineasDisponibles"),
  deltaProcesadas: document.querySelector("#deltaProcesadas"),
  deltaRechazadas: document.querySelector("#deltaRechazadas"),
  version: document.querySelector("#version"),
  autoStatus: document.querySelector("#autoStatus"),
  progressLog: document.querySelector("#progressLog"),
  orderProgress: document.querySelector("#orderProgress"),
  lineProgress: document.querySelector("#lineProgress"),
  measurementList: document.querySelector("#measurementList"),
  measurementErrors: document.querySelector("#measurementErrors"),
};

let socket = null;
let socketBound = false;
let tracking = {
  orderId: null,
  lineId: null,
  processId: null,
  orderStatus: null,
};
let refreshTimer = null;
let refreshInFlight = false;
let refreshPending = false;
let refreshNeedsMeasurements = false;
let refreshOrderRequestId = 0;
let refreshMeasurementsRequestId = 0;
let lastOrderProgressSnapshot = null;
const MAX_PROGRESS_LOG_ENTRIES = 40;
const REFRESH_MIN_INTERVAL_MS = 120;
let progressLogEntries = [];
let lastProgressLogSignature = null;
let measurementErrors = [];

const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const setEstado = (label, payload) => {
  estado.textContent = `${label}\n${typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}`;
};

const parseJsonOrThrow = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("JSON invalido en lineas");
  }
};

const api = async (path, options = {}, requiresAuth = false) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      throw new Error("No hay token. Inicia sesión primero.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    const msg = payload?.error?.message || `HTTP ${response.status}`;
    const code = payload?.error?.code ? ` (${payload.error.code})` : "";
    throw new Error(`${msg}${code}`);
  }

  return payload;
};

const setAutoStatus = (message) => {
  if (!ui.autoStatus) {
    return;
  }
  ui.autoStatus.textContent = message;
};

const formatLogTime = (isoDate) => {
  const date = isoDate ? new Date(isoDate) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }
  return date.toLocaleTimeString("es-MX", { hour12: false });
};

const resetProgressLog = (initialMessage = "Sin eventos de avance.") => {
  progressLogEntries = [];
  lastProgressLogSignature = null;
  lastOrderProgressSnapshot = null;
  measurementErrors = [];
  if (ui.progressLog) {
    ui.progressLog.textContent = initialMessage;
  }
  renderMeasurementErrors();
};

const addProgressLog = (message, { occurredAt, signature } = {}) => {
  if (!ui.progressLog || !message) {
    return;
  }

  const line = `[${formatLogTime(occurredAt)}] ${message}`;
  const entrySignature = signature || line;
  if (entrySignature === lastProgressLogSignature) {
    return;
  }
  lastProgressLogSignature = entrySignature;

  progressLogEntries.push(line);
  if (progressLogEntries.length > MAX_PROGRESS_LOG_ENTRIES) {
    progressLogEntries.shift();
  }

  ui.progressLog.textContent = progressLogEntries.join("\n");
  ui.progressLog.scrollTop = ui.progressLog.scrollHeight;
};

const connectRealtime = () => {
  const token = getToken();
  if (!token || typeof io === "undefined") {
    return;
  }

  if (socket && socket.connected) {
    return;
  }

  if (socket) {
    socket.disconnect();
  }

  socketBound = false;
  socket = io("/realtime/v1", { auth: { token } });
  bindRealtimeHandlers();
};

const scheduleRefresh = (includeMeasurements = false) => {
  if (includeMeasurements) {
    refreshNeedsMeasurements = true;
  }

  if (refreshInFlight) {
    refreshPending = true;
    return;
  }

  if (refreshTimer) {
    return;
  }

  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    runRefreshCycle();
  }, REFRESH_MIN_INTERVAL_MS);
};

const runRefreshCycle = async () => {
  if (refreshInFlight) {
    refreshPending = true;
    return;
  }

  const includeMeasurements = refreshNeedsMeasurements;
  refreshNeedsMeasurements = false;
  refreshInFlight = true;

  try {
    await refreshOrderDetail();
    if (includeMeasurements) {
      await refreshMeasurements();
    }
  } finally {
    refreshInFlight = false;
    if (refreshPending || refreshNeedsMeasurements) {
      refreshPending = false;
      scheduleRefresh(refreshNeedsMeasurements);
    }
  }
};

const bindRealtimeHandlers = () => {
  if (!socket || socketBound) {
    return;
  }

  socketBound = true;

  socket.on("connect", () => {
    setAutoStatus("Seguimiento activo. Esperando eventos...");
    addProgressLog("Conectado al canal realtime.");
  });

  socket.on("connect_error", (error) => {
    setAutoStatus(`Realtime error: ${error.message}`);
    addProgressLog(`Error realtime: ${error.message}`);
  });

  socket.on("order.summary.updated.v1", (payload) => {
    if (
      tracking.orderId &&
      Number(payload.orderId) === Number(tracking.orderId)
    ) {
      renderOrderProgress(payload);
      addProgressLog(
        `Resumen realtime: avance ${payload.porcentajeAvance}% (procesadas=${payload.totalProcesadas}, rechazadas=${payload.totalRechazadas}, canceladas=${payload.totalCanceladas}).`,
        {
          signature: `summary-${payload.orderId}-${payload.porcentajeAvance}-${payload.totalProcesadas}-${payload.totalRechazadas}-${payload.totalCanceladas}`,
        },
      );
      scheduleRefresh();
    }
  });

  socket.on("order.progress.updated.v1", (payload) => {
    if (
      tracking.orderId &&
      Number(payload.orderId) === Number(tracking.orderId)
    ) {
      addProgressLog(
        `Linea #${payload.lineId}: +${payload.deltaProcesadas} procesadas, +${payload.deltaRechazadas} rechazadas (pedido=${payload.estadoPedido}).`,
        {
          occurredAt: payload.occurredAt,
          signature:
            payload.correlationId ||
            `order-progress-${payload.orderId}-${payload.lineId}-${payload.occurredAt || Date.now()}`,
        },
      );
      scheduleRefresh();
    }
  });

  socket.on("measurement.recorded.v1", (payload) => {
    if (!tracking.orderId) {
      return;
    }

    if (
      tracking.processId &&
      Number(payload.processId) !== Number(tracking.processId)
    ) {
      return;
    }

    if (!tracking.processId) {
      addProgressLog(
        `Medicion recibida en proceso #${payload.processId}. Sincronizando...`,
        {
          occurredAt: payload.capturedAt,
          signature: `measurement-recorded-pending-${payload.processId}-${payload.measurementId}`,
        },
      );
      scheduleRefresh(true);
      return;
    }

    addProgressLog(`Medicion #${payload.measurementId}: ${payload.result}.`, {
      occurredAt: payload.capturedAt,
      signature: `measurement-recorded-${payload.processId}-${payload.measurementId}`,
    });
    scheduleRefresh(true);
  });

  socket.on("measurement.progress.applied.v1", (payload) => {
    if (
      tracking.orderId &&
      Number(payload.orderId) === Number(tracking.orderId) &&
      (payload.lineId === null ||
        Number(payload.lineId) === Number(tracking.lineId))
    ) {
      addProgressLog(
        `Aplicado desde medicion #${payload.measurementId}: +${payload.deltaProcesadas} procesadas, +${payload.deltaRechazadas} rechazadas.`,
        {
          occurredAt: payload.occurredAt,
          signature:
            payload.correlationId ||
            `measurement-progress-${payload.processId}-${payload.measurementId}`,
        },
      );
      scheduleRefresh(true);
    }
  });

  socket.on("measurement.error.v1", (payload) => {
    if (
      !tracking.orderId ||
      Number(payload.orderId) !== Number(tracking.orderId) ||
      (payload.lineId !== null && Number(payload.lineId) !== Number(tracking.lineId))
    ) {
      return;
    }

    measurementErrors.push(payload);
    if (measurementErrors.length > 20) {
      measurementErrors.shift();
    }

    addProgressLog(
      `Error de medicion: ${formatMeasurementErrorReason(payload.reason)}. Reproceso solicitado.`,
      {
        occurredAt: payload.occurredAt,
        signature:
          payload.faultyIdempotencyKey ||
          `measurement-error-${payload.orderId}-${payload.lineId}-${payload.occurredAt || Date.now()}`,
      },
    );
    renderMeasurementErrors();
  });

  socket.on("measurement.process.started.v1", (payload) => {
    if (
      tracking.orderId &&
      Number(payload.orderId) === Number(tracking.orderId) &&
      (payload.lineId === null ||
        Number(payload.lineId) === Number(tracking.lineId))
    ) {
      tracking.processId = Number(payload.processId);
      addProgressLog(`Proceso de medicion iniciado (#${payload.processId}).`, {
        occurredAt: payload.startedAt,
        signature: `measurement-process-started-${payload.processId}`,
      });
      scheduleRefresh(true);
    }
  });

  socket.on("measurement.process.state.changed.v1", (payload) => {
    if (!tracking.orderId) {
      return;
    }

    const hasProcessMatch =
      tracking.processId &&
      Number(payload.processId) === Number(tracking.processId);
    const hasOrderLineMatch =
      Number(payload.orderId) === Number(tracking.orderId) &&
      (payload.lineId === null ||
        Number(payload.lineId) === Number(tracking.lineId));

    if (!hasProcessMatch && !hasOrderLineMatch) {
      return;
    }

    if (!tracking.processId && Number.isFinite(Number(payload.processId))) {
      tracking.processId = Number(payload.processId);
    }

    addProgressLog(
      `Proceso #${payload.processId}: ${payload.previousState || "-"} -> ${payload.currentState}.`,
      {
        occurredAt: payload.occurredAt,
        signature:
          payload.correlationId ||
          `measurement-process-state-${payload.processId}-${payload.occurredAt || Date.now()}`,
      },
    );
    scheduleRefresh(true);
  });
};

const renderOrderProgress = (progress) => {
  if (!ui.orderProgress) {
    return;
  }

  const status = tracking.orderStatus
    ? `Estado: ${tracking.orderStatus}`
    : "Estado: -";

  const mergedProgress = {
    ...(lastOrderProgressSnapshot || {}),
    ...(progress || {}),
  };
  lastOrderProgressSnapshot = mergedProgress;

  ui.orderProgress.textContent = [
    status,
    `Lineas: ${mergedProgress.totalLineas ?? "-"}`,
    `Solicitadas: ${mergedProgress.totalSolicitadas ?? "-"}`,
    `Procesadas: ${mergedProgress.totalProcesadas ?? "-"}`,
    `Rechazadas: ${mergedProgress.totalRechazadas ?? "-"}`,
    `Canceladas: ${mergedProgress.totalCanceladas ?? "-"}`,
    `Restantes: ${mergedProgress.totalRestantes ?? "-"}`,
    `Avance: ${mergedProgress.porcentajeAvance ?? "-"}%`,
  ].join("\n");
};

const renderLineProgress = (linea) => {
  if (!ui.lineProgress) {
    return;
  }

  if (!linea) {
    ui.lineProgress.textContent = "Sin linea seleccionada.";
    return;
  }

  const restantes = Math.max(
    0,
    linea.cantidad - linea.procesadas - linea.rechazadas,
  );

  ui.lineProgress.textContent = [
    `Linea #${linea.id}`,
    `Modelo: ${linea.modeloProductoId}`,
    `Cantidad: ${linea.cantidad}`,
    `Procesadas: ${linea.procesadas}`,
    `Rechazadas: ${linea.rechazadas}`,
    `Restantes: ${restantes}`,
    `Estado: ${linea.estadoLinea}`,
    `Version: ${linea.version}`,
  ].join("\n");
};

const renderMeasurements = (measurements = []) => {
  if (!ui.measurementList) {
    return;
  }

  if (!measurements.length) {
    ui.measurementList.innerHTML = "<small>Sin mediciones.</small>";
    return;
  }

  const items = measurements
    .slice(-10)
    .map((measurement) => {
      const ok = measurement.resultadoFinal === "APROBADA";
      const statusClass = ok ? "ok" : "fail";
      return [
        `<div>`,
        `<span class="badge ${statusClass}">${measurement.resultadoFinal}</span>`,
        `Medicion #${measurement.id} - ${measurement.capturadaEn}`,
        `<br/>Checks: qr=${measurement.qrOk}, peso=${measurement.pesoOk}, color=${measurement.colorOk}, altura=${measurement.alturaOk}`,
        `</div>`,
      ].join("");
    })
    .join("<hr/>");

  ui.measurementList.innerHTML = items;
};

const formatMeasurementValue = (value) => {
  if (value === true) {
    return "OK";
  }
  if (value === false) {
    return "Falla";
  }
  if (value === null || typeof value === "undefined" || value === "") {
    return "n/a";
  }
  return String(value);
};

const formatMeasurementErrorReason = (reason) => {
  const labels = {
    wrong_product: "Producto incorrecto",
    bad_attributes: "Atributos fuera de rango",
    measurement_error: "Error de medicion",
  };
  return labels[reason] || reason || "Error de medicion";
};

const renderMeasurementErrors = () => {
  if (!ui.measurementErrors) {
    return;
  }

  if (!measurementErrors.length) {
    ui.measurementErrors.innerHTML = "Sin errores.";
    return;
  }

  const latest = measurementErrors[measurementErrors.length - 1];
  const expected = latest.expected || {};
  const received = latest.received || {};
  const fields = [
    ["modeloProductoId", "Modelo"],
    ["qrOk", "QR"],
    ["pesoOk", "Peso"],
    ["colorOk", "Color"],
    ["alturaOk", "Altura"],
  ];

  const comparison = fields
    .map(([key, label]) => {
      const expectedValue = formatMeasurementValue(expected[key]);
      const receivedValue = formatMeasurementValue(received[key]);
      const mismatch = expectedValue !== receivedValue;
      return [
        `<span class="head">${label}</span>`,
        `<span>${expectedValue}</span>`,
        `<span class="${mismatch ? "bad" : ""}">${receivedValue}</span>`,
      ].join("");
    })
    .join("");

  ui.measurementErrors.innerHTML = [
    `<div class="error-summary">`,
    `<span class="error-count">${measurementErrors.length} error${measurementErrors.length === 1 ? "" : "es"}</span>`,
    `<div>${formatMeasurementErrorReason(latest.reason)}</div>`,
    `<small>Ultimo evento: ${latest.occurredAt || "-"}</small>`,
    `<div class="comparison">`,
    `<span class="head">Campo</span><span class="head">Esperado</span><span class="head">Medido</span>`,
    comparison,
    `</div>`,
    `</div>`,
  ].join("");
};

const refreshOrderDetail = async () => {
  if (!tracking.orderId) {
    return;
  }

  try {
    const requestId = ++refreshOrderRequestId;
    const data = await api(
      `/api/v1/orders/${tracking.orderId}`,
      { method: "GET" },
      true,
    );
    if (requestId !== refreshOrderRequestId) {
      return;
    }
    const progress = data?.data?.progress;
    tracking.orderStatus = data?.data?.order?.estado || null;
    if (progress) {
      renderOrderProgress(progress);
    }

    const lineas = data?.data?.lineas || [];
    const linea = lineas.find(
      (item) => Number(item.id) === Number(tracking.lineId),
    );
    renderLineProgress(linea);

    if (progress) {
      const lineaLabel = linea
        ? `L${linea.id}: p=${linea.procesadas}, r=${linea.rechazadas}, v=${linea.version}, e=${linea.estadoLinea}`
        : "sin_linea";
      addProgressLog(
        `Snapshot: avance ${progress.porcentajeAvance}% (proc=${progress.totalProcesadas}, rech=${progress.totalRechazadas}, rest=${progress.totalRestantes}) estado=${tracking.orderStatus || "-"}.`,
        {
          signature: `snapshot-${tracking.orderId}-${tracking.orderStatus || "-"}-${progress.porcentajeAvance}-${progress.totalProcesadas}-${progress.totalRechazadas}-${progress.totalRestantes}-${lineaLabel}`,
        },
      );
    }

    if (linea && typeof linea.version !== "undefined") {
      ui.version.value = String(linea.version);
    }
  } catch (error) {
    setAutoStatus(`Error refrescando pedido: ${error.message}`);
  }
};

const refreshMeasurements = async () => {
  if (!tracking.orderId || !tracking.lineId) {
    return;
  }

  try {
    const requestId = ++refreshMeasurementsRequestId;
    const list = await api(
      `/api/v1/orders/${tracking.orderId}/measurement-processes`,
      { method: "GET" },
      true,
    );
    if (requestId !== refreshMeasurementsRequestId) {
      return;
    }
    const processes = list?.data || [];
    const matched = processes.find(
      (process) => Number(process.lineaPedidoId) === Number(tracking.lineId),
    );
    if (!matched) {
      if (tracking.processId) {
        addProgressLog(
          `Proceso de medicion #${tracking.processId} ya no disponible para la linea seleccionada.`,
          {
            signature: `measurement-process-missing-${tracking.orderId}-${tracking.lineId}-${tracking.processId}`,
          },
        );
      }
      tracking.processId = null;
      renderMeasurements([]);
      return;
    }

    if (Number(tracking.processId) !== Number(matched.id)) {
      addProgressLog(`Proceso de medicion asociado: #${matched.id}.`, {
        signature: `measurement-process-linked-${matched.id}`,
      });
    }
    tracking.processId = matched.id;
    const detail = await api(
      `/api/v1/measurement-processes/${matched.id}`,
      { method: "GET" },
      true,
    );
    renderMeasurements(detail?.data?.mediciones || []);
  } catch (error) {
    setAutoStatus(`Error cargando mediciones: ${error.message}`);
  }
};

const startAutoTracking = async () => {
  if (!getToken()) {
    setAutoStatus("Inicia sesion para activar el seguimiento automatico.");
    return;
  }

  const orderId = Number(ui.orderId.value);
  const lineId = Number(ui.lineId.value);

  if (
    !Number.isFinite(orderId) ||
    !Number.isFinite(lineId) ||
    orderId <= 0 ||
    lineId <= 0
  ) {
    setAutoStatus(
      "Selecciona un Order ID y Line ID validos para activar el seguimiento.",
    );
    return;
  }

  tracking = { orderId, lineId, processId: null, orderStatus: null };
  resetProgressLog(
    `Seguimiento iniciado para pedido #${orderId}, linea #${lineId}.`,
  );
  addProgressLog(
    `Seguimiento activo para pedido #${orderId}, linea #${lineId}.`,
    {
      signature: `tracking-start-${orderId}-${lineId}`,
    },
  );
  setAutoStatus(
    `Seguimiento activo para pedido #${orderId}, linea #${lineId}.`,
  );

  connectRealtime();
  await refreshOrderDetail();
  await refreshMeasurements();
};

const autoFillClientIdFromMe = async () => {
  try {
    const me = await api("/api/v1/protected/me", { method: "GET" }, true);
    const id = me?.data?.id;
    if (id) {
      ui.createClienteId.value = String(id);
      ui.listClienteId.value = String(id);
    }
    setEstado("Sesion validada (/protected/me):", me);
    connectRealtime();
  } catch (error) {
    setEstado("No se pudo autocompletar clienteId:", error.message);
  }
};

const renderLineasDisponibles = (detail) => {
  const lineas = detail?.data?.lineas || [];

  if (!lineas.length) {
    ui.lineasDisponibles.innerHTML =
      "<small>No hay líneas para este pedido.</small>";
    return;
  }

  const items = lineas
    .map(
      (linea) =>
        `<button class="secondary" data-line-id="${linea.id}" data-version="${linea.version || 0}" style="margin-right:8px;margin-top:8px;">` +
        `Usar línea #${linea.id} (v${linea.version || 0})` +
        "</button>",
    )
    .join("");

  ui.lineasDisponibles.innerHTML = `<p><small>Selecciona una línea del pedido:</small></p>${items}`;

  ui.lineasDisponibles
    .querySelectorAll("button[data-line-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        ui.lineId.value = button.dataset.lineId;
        ui.version.value = button.dataset.version || "0";
        setEstado("Línea seleccionada:", {
          lineId: Number(ui.lineId.value),
          version: Number(ui.version.value),
        });
        startAutoTracking();
      });
    });
};

document.querySelector("#btnRegister").addEventListener("click", async () => {
  try {
    const payload = {
      nombre: ui.registerNombre.value.trim(),
      contrasena: ui.registerContrasena.value,
    };
    const data = await api("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setEstado("Cliente registrado:", data);
  } catch (error) {
    setEstado("Error en registro:", error.message);
  }
});

document.querySelector("#btnLogin").addEventListener("click", async () => {
  try {
    const payload = {
      nombre: ui.loginNombre.value.trim(),
      contrasena: ui.loginContrasena.value,
    };
    const data = await api("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const token = data?.data?.token;
    if (!token) {
      throw new Error("El login no devolvio token");
    }

    setToken(token);
    setEstado("Login exitoso. Token client guardado en localStorage.", data);
    connectRealtime();
    await autoFillClientIdFromMe();
  } catch (error) {
    setEstado("Error en login:", error.message);
  }
});

document
  .querySelector("#btnMe")
  .addEventListener("click", autoFillClientIdFromMe);

document.querySelector("#btnLogout").addEventListener("click", () => {
  clearToken();
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  refreshInFlight = false;
  refreshPending = false;
  refreshNeedsMeasurements = false;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socketBound = false;
  tracking = { orderId: null, lineId: null, processId: null, orderStatus: null };
  resetProgressLog();
  if (ui.orderProgress) {
    ui.orderProgress.textContent = "-";
  }
  if (ui.lineProgress) {
    ui.lineProgress.textContent = "-";
  }
  if (ui.measurementList) {
    ui.measurementList.innerHTML = "<small>Sin mediciones.</small>";
  }
  setAutoStatus("Sin seguimiento activo.");
  setEstado("Sesion cerrada.", "Token eliminado de localStorage.");
});

document
  .querySelector("#btnCreateOrder")
  .addEventListener("click", async () => {
    try {
      const payload = {
        clienteId: Number(ui.createClienteId.value),
        lineas: parseJsonOrThrow(ui.createLineas.value),
      };

      const data = await api(
        "/api/v1/orders",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        true,
      );

      if (data?.data?.order?.id) {
        ui.orderId.value = String(data.data.order.id);
      }

      setEstado("Pedido creado:", data);
    } catch (error) {
      setEstado("Error creando pedido:", error.message);
    }
  });

document.querySelector("#btnListOrders").addEventListener("click", async () => {
  try {
    const clienteId = Number(ui.listClienteId.value);
    const data = await api(
      `/api/v1/orders?clienteId=${clienteId}&page=1&pageSize=20`,
      {
        method: "GET",
      },
      true,
    );
    setEstado("Listado de pedidos:", data);
  } catch (error) {
    setEstado("Error listando pedidos:", error.message);
  }
});

document.querySelector("#btnGetOrder").addEventListener("click", async () => {
  try {
    const orderId = Number(ui.orderId.value);
    const data = await api(
      `/api/v1/orders/${orderId}`,
      {
        method: "GET",
      },
      true,
    );

    const primeraLinea = data?.data?.lineas?.[0];
    if (primeraLinea?.id) {
      ui.lineId.value = String(primeraLinea.id);
      ui.version.value = String(primeraLinea.version || 0);
    }

    renderLineasDisponibles(data);

    setEstado("Detalle de pedido:", data);
    startAutoTracking();
  } catch (error) {
    setEstado("Error consultando detalle:", error.message);
  }
});

document
  .querySelector("#btnUpdateProgress")
  .addEventListener("click", async () => {
    try {
      const orderId = Number(ui.orderId.value);
      const lineId = Number(ui.lineId.value);
      if (
        !Number.isFinite(orderId) ||
        !Number.isFinite(lineId) ||
        orderId <= 0 ||
        lineId <= 0
      ) {
        throw new Error("Order ID y Line ID deben ser numeros positivos.");
      }

      const payload = {
        deltaProcesadas: Number(ui.deltaProcesadas.value),
        deltaRechazadas: Number(ui.deltaRechazadas.value),
        version: Number(ui.version.value),
      };

      const data = await api(
        `/api/v1/orders/${orderId}/lines/${lineId}/progress`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        true,
      );

      const lineaActualizada = (data?.data?.lineas || []).find(
        (linea) => Number(linea.id) === lineId,
      );
      if (lineaActualizada) {
        ui.version.value = String(lineaActualizada.version || payload.version);
      }
      renderLineasDisponibles(data);

      setEstado("Progreso actualizado:", data);
    } catch (error) {
      setEstado("Error actualizando progreso:", error.message);
    }
  });

document.querySelector("#btnCancelLine").addEventListener("click", async () => {
  try {
    const orderId = Number(ui.orderId.value);
    const lineId = Number(ui.lineId.value);
    if (
      !Number.isFinite(orderId) ||
      !Number.isFinite(lineId) ||
      orderId <= 0 ||
      lineId <= 0
    ) {
      throw new Error("Order ID y Line ID deben ser numeros positivos.");
    }

    const data = await api(
      `/api/v1/orders/${orderId}/lines/${lineId}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    );

    const lineaActualizada = (data?.data?.lineas || []).find(
      (linea) => Number(linea.id) === lineId,
    );
    if (lineaActualizada) {
      ui.version.value = String(lineaActualizada.version || ui.version.value);
    }
    renderLineasDisponibles(data);

    setEstado("Linea cancelada:", data);
  } catch (error) {
    setEstado("Error cancelando linea:", error.message);
  }
});

document
  .querySelector("#btnCancelOrder")
  .addEventListener("click", async () => {
    try {
      const orderId = Number(ui.orderId.value);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        throw new Error("Order ID debe ser un numero positivo.");
      }

      const data = await api(
        `/api/v1/orders/${orderId}/cancel`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        true,
      );

      renderLineasDisponibles(data);
      await refreshOrderDetail();
      await refreshMeasurements();

      setEstado("Pedido cancelado:", data);
    } catch (error) {
      setEstado("Error cancelando pedido:", error.message);
    }
  });

if (getToken()) {
  autoFillClientIdFromMe();
}
