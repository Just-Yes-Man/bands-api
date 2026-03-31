const BandaControl = require('../models/bandaControl');

const bandaControl = new BandaControl();

const emitirEstado = (io) => {
 io.emit('pasos-pendientes', bandaControl.pasosPendientes.length);
 io.emit('ultimas-revisiones', bandaControl.ultimasRevisiones);
};

const logError = (contexto, error) => {
 console.error(`[PostgreSQL][${contexto}] ${error.message}`);

 if (error.code) {
  console.error(`[PostgreSQL][${contexto}] code=${error.code}`);
 }

 if (error.detail) {
  console.error(`[PostgreSQL][${contexto}] detail=${error.detail}`);
 }

 if (error.hint) {
  console.error(`[PostgreSQL][${contexto}] hint=${error.hint}`);
 }
};

const obtenerMonitores = async () => {
 try {
  if (!bandaControl.monitoresActivos.length) {
   await bandaControl.inicializarDesdeDB();
  }

  return {
   ok: true,
   monitores: bandaControl.monitoresActivos
  };
 } catch (error) {
  logError('obtenerMonitores', error);

  return {
   ok: false,
   msg: 'No se pudo conectar a PostgreSQL para leer monitores'
  };
 }
};

const socketController = async (socket, io) => {
 console.log('Cliente conectado');

 const monitores = await obtenerMonitores();

 if (monitores.ok) {
  socket.emit('monitores-activos', monitores.monitores);
 } else {
  socket.emit('estado-inicial-error', monitores);
 }

 socket.emit('pasos-pendientes', bandaControl.pasosPendientes.length);
 socket.emit('ultimas-revisiones', bandaControl.ultimasRevisiones);

 socket.on('crear-modelo-producto', async (payload, callback = () => {}) => {
  try {
   const resultado = await bandaControl.crearModeloProducto(payload);
   callback(resultado);
  } catch (error) {
   logError('crear-modelo-producto', error);
   callback({
    ok: false,
    msg: 'No se pudo crear el modelo de producto'
   });
  }
 });

 socket.on('registrar-paso-producto', async (payload, callback = () => {}) => {
  try {
   const monitoresActualizados = await obtenerMonitores();

   if (!monitoresActualizados.ok) {
    return callback(monitoresActualizados);
   }

   const registro = await bandaControl.registrarPasoProducto(payload);

   callback(registro);

   if (registro.ok) {
    emitirEstado(io);
   }
  } catch (error) {
   logError('registrar-paso-producto', error);

   callback({
    ok: false,
    msg: 'No se pudo registrar el paso del producto'
   });
  }
 });

 socket.on('revisar-siguiente-producto', ({ monitorId } = {}, callback = () => {}) => {
  if (!monitorId) {
   return callback({
    ok: false,
    msg: 'El monitor es obligatorio'
   });
  }

  const revision = bandaControl.revisarSiguienteProducto(monitorId);

  callback({
   ok: true,
   revision
  });

  emitirEstado(io);
 });
};

module.exports = {
 socketController
};
