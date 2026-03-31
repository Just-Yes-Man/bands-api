const pool = require('../db/pool');

class ProductoEnBanda {
 constructor({ idPaso, modelo, canal, monitor, metrics }) {
  this.idPaso = idPaso;
  this.modelo = modelo;
  this.canal = canal;
  this.monitor = monitor;
  this.metrics = metrics;
 }
}

class BandaControl {
 constructor() {
  this.pasosPendientes = [];
  this.ultimasRevisiones = [];
  this.ultimoPaso = 0;
  this.monitoresActivos = [];
 }

 async inicializarDesdeDB() {
  const query = `
   SELECT id, nombre, canal
   FROM monitores_proceso
   WHERE activo = true
   ORDER BY id ASC;
  `;

  const { rows } = await pool.query(query);

  this.monitoresActivos = rows;
  return rows;
 }

 async registrarPasoProducto({ qr, peso, color, altura, canal = '1' }) {
  if (!qr || peso === undefined || !color || altura === undefined) {
   return {
    ok: false,
    msg: 'QR, peso, color y altura son obligatorios'
   };
  }

  const query = `
   SELECT id, tipo, qr, peso_esperado, color_esperado, altura_esperada
   FROM modelos_producto
   WHERE qr = $1 AND activo = true
   LIMIT 1;
  `;

  const { rows } = await pool.query(query, [qr]);

  if (!rows.length) {
   return {
    ok: false,
    msg: `No existe un modelo activo para el QR ${qr}`
   };
  }

  this.ultimoPaso += 1;

  const modelo = rows[0];

  const paso = new ProductoEnBanda({
   idPaso: this.ultimoPaso,
   modelo: {
    id: modelo.id,
    tipo: modelo.tipo,
    qr: modelo.qr,
    esperado: {
     peso: modelo.peso_esperado,
     color: modelo.color_esperado,
     altura: modelo.altura_esperada
    }
   },
   canal,
   monitor: null,
   metrics: {
    peso,
    color,
    altura
   }
  });

  this.pasosPendientes.push(paso);

  return {
   ok: true,
   paso
  };
 }

 revisarSiguienteProducto(monitorId) {
  if (!this.pasosPendientes.length) {
   return null;
  }

  const paso = this.pasosPendientes.shift();

  const monitor = this.monitoresActivos.find((m) => m.id === Number(monitorId));

  paso.monitor = monitor || {
   id: null,
   nombre: `Monitor ${monitorId}`,
   canal: paso.canal
  };

  const esperado = paso.modelo.esperado;

  paso.resultado = {
   pesoOk: esperado.peso === paso.metrics.peso,
   colorOk: esperado.color.toLowerCase() === String(paso.metrics.color).toLowerCase(),
   alturaOk: esperado.altura === paso.metrics.altura
  };

  paso.aprobado = Object.values(paso.resultado).every(Boolean);

  this.ultimasRevisiones.unshift(paso);

  if (this.ultimasRevisiones.length > 4) {
   this.ultimasRevisiones.splice(-1, 1);
  }

  return paso;
 }
}

module.exports = BandaControl;
