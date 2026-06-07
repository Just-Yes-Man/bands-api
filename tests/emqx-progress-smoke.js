const path = require('path');
const mqtt = require('mqtt');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:1200/api/v1';
const mqttUrl = process.env.SMOKE_MQTT_URL || process.env.EMQX_URL || 'mqtt://localhost:1883';
const databaseUrl = process.env.SMOKE_DATABASE_URL || process.env.DATABASE_URL;

const normalizeConnectionString = (rawUrl) => {
  const parsed = new URL(rawUrl);
  if (parsed.searchParams.get('sslmode') === 'require') {
    parsed.searchParams.set('sslmode', 'no-verify');
  }
  return parsed.toString();
};

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
  const topics = ['pedidos/creacion', 'pedidos/avances'];
  const seen = [];
  let mqttClient;

  try {
    const registerName = `cliente_avance_${Date.now()}`;
    const password = 'Pass1234';

    const register = await jsonReq(`${baseUrl}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ nombre: registerName, contrasena: password })
    });
    if (register.status !== 201) {
      throw new Error(`Registro inesperado: ${register.status}`);
    }

    const clienteId = register.body && register.body.data ? register.body.data.id : null;
    if (!clienteId) {
      throw new Error('No se pudo obtener clienteId');
    }

    const login = await jsonReq(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ nombre: registerName, contrasena: password })
    });
    if (login.status !== 200 || !login.body || !login.body.data || !login.body.data.token) {
      throw new Error(`Login inesperado: ${login.status}`);
    }

    const token = login.body.data.token;

    const mqttReady = new Promise((resolve, reject) => {
      mqttClient = mqtt.connect(mqttUrl, {
        username: process.env.SMOKE_MQTT_USERNAME || process.env.EMQX_USERNAME,
        password: process.env.SMOKE_MQTT_PASSWORD || process.env.EMQX_PASSWORD,
        reconnectPeriod: 3000,
        connectTimeout: 10000
      });
      mqttClient.once('connect', () => {
        mqttClient.subscribe(topics, { qos: 1 }, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
      mqttClient.once('error', reject);
      mqttClient.on('message', (topic, payload) => {
        try {
          const json = JSON.parse(payload.toString());
          seen.push({ topic, event: json.event, orderId: json.order && json.order.id });
        } catch {
          seen.push({ topic, event: 'raw', orderId: null });
        }
      });
    });

    await mqttReady;

    const createOrder = await jsonReq(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        clienteId,
        lineas: [{ modeloProductoId: 1, cantidad: 2 }]
      })
    });
    if (createOrder.status !== 201) {
      throw new Error(`Fallo create order: ${createOrder.status} ${JSON.stringify(createOrder.body)}`);
    }

    const orderId = createOrder.body.data.order.id;
    const lineaId = createOrder.body.data.lineas[0].id;
    const version = createOrder.body.data.lineas[0].version;

    const progress = await jsonReq(`${baseUrl}/orders/${orderId}/lines/${lineaId}/progress`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ deltaProcesadas: 1, deltaRechazadas: 0, version })
    });
    if (progress.status !== 200) {
      throw new Error(`Fallo progress update: ${progress.status} ${JSON.stringify(progress.body)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const createdSeen = seen.some((m) => m.topic === 'pedidos/creacion' && m.event === 'pedido.creado');
    const progressSeen = seen.some((m) => m.topic === 'pedidos/avances' && m.event === 'pedido.avance');

    if (!createdSeen || !progressSeen) {
      throw new Error(`No llegaron ambos eventos esperados. Seen=${JSON.stringify(seen)}`);
    }

    console.log('EMQX_PROGRESS_OK', JSON.stringify({ orderId, seen }));
  } catch (error) {
    console.error('EMQX_PROGRESS_FAIL', error.message);
    process.exitCode = 1;
  } finally {
    if (mqttClient) {
      mqttClient.end(true);
    }
  }
})();
