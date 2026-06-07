const path = require('path');
const mqtt = require('mqtt');
const { Pool } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:1200/api/v1';
const topic = 'pedidos/creacion';

const normalizeConnectionString = (rawUrl) => {
  const parsed = new URL(rawUrl);
  if (parsed.searchParams.get('sslmode') === 'require') {
    parsed.searchParams.set('sslmode', 'no-verify');
  }
  return parsed.toString();
};

const databaseUrl = process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL;

const pool = databaseUrl
  ? new Pool({
      connectionString: normalizeConnectionString(databaseUrl),
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.SMOKE_PGHOST || 'localhost',
      port: Number(process.env.SMOKE_PGPORT || 5432),
      database: process.env.SMOKE_PGDATABASE || 'conveyor',
      user: process.env.SMOKE_PGUSER || 'postgres',
      password: process.env.SMOKE_PGPASSWORD || 'postgres'
    });

const mqttUrl = process.env.SMOKE_MQTT_URL || process.env.EMQX_URL || 'mqtt://localhost:1884';

const jsonReq = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { status: res.status, body };
};

(async () => {
  let mqttClient;

  try {
    const modelResult = await pool.query(
      `INSERT INTO modelos_producto(tipo, qr, peso_esperado, color_esperado, altura_esperada, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (tipo)
       DO UPDATE SET qr = EXCLUDED.qr
       RETURNING id`,
      ['modelo-emqx-test', `QR-EMQX-${Date.now()}`, 100, 'negro', 10]
    );

    const modeloId = modelResult.rows[0].id;
    const registerName = `cliente_emqx_${Date.now()}`;
    const password = 'Pass1234';

    const register = await jsonReq(`${baseUrl}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nombre: registerName, contrasena: password })
    });

    if (register.status !== 201) {
      throw new Error(`Registro inesperado: ${register.status} ${JSON.stringify(register.body)}`);
    }

    const clientRow = await pool.query('SELECT id FROM clientes WHERE nombre = $1 LIMIT 1', [registerName]);
    if (!clientRow.rowCount) {
      throw new Error('No se encontro cliente luego del registro');
    }

    const clienteId = clientRow.rows[0].id;

    const login = await jsonReq(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ nombre: registerName, contrasena: password })
    });

    if (login.status !== 200 || !login.body?.data?.token) {
      throw new Error(`Login inesperado: ${login.status} ${JSON.stringify(login.body)}`);
    }

    const token = login.body.data.token;

    const mqttMessagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout esperando mensaje MQTT')), 15000);
      mqttClient = mqtt.connect(mqttUrl, {
        username: process.env.SMOKE_MQTT_USERNAME || process.env.EMQX_USERNAME,
        password: process.env.SMOKE_MQTT_PASSWORD || process.env.EMQX_PASSWORD,
        reconnectPeriod: 3000,
        connectTimeout: 10000
      });

      mqttClient.on('connect', () => {
        mqttClient.subscribe(topic, { qos: 1 }, (err) => {
          if (err) {
            clearTimeout(timeout);
            reject(err);
          }
        });
      });

      mqttClient.on('message', (receivedTopic, payload) => {
        if (receivedTopic !== topic) {
          return;
        }

        clearTimeout(timeout);
        try {
          resolve(JSON.parse(payload.toString()));
        } catch {
          resolve({ raw: payload.toString() });
        }
      });

      mqttClient.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const createOrder = await jsonReq(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        clienteId,
        lineas: [{ modeloProductoId: modeloId, cantidad: 2 }]
      })
    });

    if (createOrder.status !== 201) {
      throw new Error(`Creacion de pedido fallo: ${createOrder.status} ${JSON.stringify(createOrder.body)}`);
    }

    const mqttPayload = await mqttMessagePromise;

    console.log('EMQX_OK', JSON.stringify({
      orderId: createOrder.body?.data?.order?.id,
      topic,
      mqttEvent: mqttPayload?.event,
      mqttOrderId: mqttPayload?.order?.id
    }));

    if (!mqttPayload?.order?.id || mqttPayload.order.id !== createOrder.body?.data?.order?.id) {
      throw new Error(`Mensaje MQTT no coincide con pedido creado: ${JSON.stringify(mqttPayload)}`);
    }

    console.log('INTEGRATION_OK');
  } catch (error) {
    console.error('INTEGRATION_FAIL', error && error.message ? error.message : error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    process.exitCode = 1;
  } finally {
    if (mqttClient) {
      mqttClient.end(true);
    }

    await pool.end();
  }
})();
