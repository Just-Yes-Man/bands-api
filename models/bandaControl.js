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



 async crearModeloProducto({ tipo, qr, pesoEsperado, colorEsperado, alturaEsperada }) {
  if (!tipo || !qr || pesoEsperado === undefined || !colorEsperado || alturaEsperada === undefined) {
   return {
    ok: false,
    msg: 'tipo, qr, pesoEsperado, colorEsperado y alturaEsperada son obligatorios'
   };
  }

  const query = `
   INSERT INTO modelos_producto (tipo, qr, peso_esperado, color_esperado, altura_esperada)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id, tipo, qr, peso_esperado, color_esperado, altura_esperada, activo, created_at;
  `;

  const params = [tipo, qr, Number(pesoEsperado), colorEsperado, Number(alturaEsperada)];

  try {
   const { rows } = await pool.query(query, params);

   return {
    ok: true,
    modelo: rows[0]
   };
  } catch (error) {
   return {
    ok: false,
    msg: `No se pudo crear el modelo ideal: ${error.message}`
   };
  }
 }
 async obtenerModeloIdeal(modeloReferencia) {
  if (modeloReferencia) {
   const query = `
    SELECT id, tipo, qr, peso_esperado, color_esperado, altura_esperada
    FROM modelos_producto
    WHERE activo = true AND (tipo = $1 OR qr = $1)
    ORDER BY id ASC
    LIMIT 1;
   `;

   const { rows } = await pool.query(query, [modeloReferencia]);
   return rows[0] || null;
  }

  const query = `
   SELECT id, tipo, qr, peso_esperado, color_esperado, altura_esperada
   FROM modelos_producto
   WHERE activo = true
   ORDER BY id ASC
   LIMIT 1;
  `;

  const { rows } = await pool.query(query);
  return rows[0] || null;
 }

 async registrarPasoProducto({ qr, peso, color, altura, canal = '1', modeloReferencia }) {
  if (!qr || peso === undefined || !color || altura === undefined) {
   return {
    ok: false,
    msg: 'QR, peso, color y altura son obligatorios'
   };
  }

  const modelo = await this.obtenerModeloIdeal(modeloReferencia);

  if (!modelo) {
   return {
    ok: false,
    msg: 'No hay modelos activos en modelos_producto para comparar la medición'
   };
  }

  this.ultimoPaso += 1;

  const paso = new ProductoEnBanda({
   idPaso: this.ultimoPaso,
   modelo: {
    id: modelo.id,
    tipo: modelo.tipo,
    qrIdeal: modelo.qr,
    qrMedido: qr,
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
