const estado = document.querySelector('#estado');
const TOKEN_KEY = 'bands_api_token';

const ui = {
  registerNombre: document.querySelector('#registerNombre'),
  registerContrasena: document.querySelector('#registerContrasena'),
  loginNombre: document.querySelector('#loginNombre'),
  loginContrasena: document.querySelector('#loginContrasena'),
  createClienteId: document.querySelector('#createClienteId'),
  createLineas: document.querySelector('#createLineas'),
  listClienteId: document.querySelector('#listClienteId'),
  orderId: document.querySelector('#orderId'),
  lineId: document.querySelector('#lineId'),
  lineasDisponibles: document.querySelector('#lineasDisponibles'),
  deltaProcesadas: document.querySelector('#deltaProcesadas'),
  deltaRechazadas: document.querySelector('#deltaRechazadas'),
  version: document.querySelector('#version')
};

const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const setEstado = (label, payload) => {
  estado.textContent = `${label}\n${typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)}`;
};

const parseJsonOrThrow = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('JSON invalido en lineas');
  }
};

const api = async (path, options = {}, requiresAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('No hay token. Inicia sesión primero.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.ok === false) {
    const msg = payload?.error?.message || `HTTP ${response.status}`;
    const code = payload?.error?.code ? ` (${payload.error.code})` : '';
    throw new Error(`${msg}${code}`);
  }

  return payload;
};

const autoFillClientIdFromMe = async () => {
  try {
    const me = await api('/api/v1/protected/me', { method: 'GET' }, true);
    const id = me?.data?.id;
    if (id) {
      ui.createClienteId.value = String(id);
      ui.listClienteId.value = String(id);
    }
    setEstado('Sesion validada (/protected/me):', me);
  } catch (error) {
    setEstado('No se pudo autocompletar clienteId:', error.message);
  }
};

const renderLineasDisponibles = (detail) => {
  const lineas = detail?.data?.lineas || [];

  if (!lineas.length) {
    ui.lineasDisponibles.innerHTML = '<small>No hay líneas para este pedido.</small>';
    return;
  }

  const items = lineas.map((linea) => (
    `<button class="secondary" data-line-id="${linea.id}" data-version="${linea.version || 0}" style="margin-right:8px;margin-top:8px;">` +
    `Usar línea #${linea.id} (v${linea.version || 0})` +
    '</button>'
  )).join('');

  ui.lineasDisponibles.innerHTML = `<p><small>Selecciona una línea del pedido:</small></p>${items}`;

  ui.lineasDisponibles.querySelectorAll('button[data-line-id]').forEach((button) => {
    button.addEventListener('click', () => {
      ui.lineId.value = button.dataset.lineId;
      ui.version.value = button.dataset.version || '0';
      setEstado('Línea seleccionada:', {
        lineId: Number(ui.lineId.value),
        version: Number(ui.version.value)
      });
    });
  });
};

document.querySelector('#btnRegister').addEventListener('click', async () => {
  try {
    const payload = {
      nombre: ui.registerNombre.value.trim(),
      contrasena: ui.registerContrasena.value
    };
    const data = await api('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setEstado('Cliente registrado:', data);
  } catch (error) {
    setEstado('Error en registro:', error.message);
  }
});

document.querySelector('#btnLogin').addEventListener('click', async () => {
  try {
    const payload = {
      nombre: ui.loginNombre.value.trim(),
      contrasena: ui.loginContrasena.value
    };
    const data = await api('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const token = data?.data?.token;
    if (!token) {
      throw new Error('El login no devolvio token');
    }

    setToken(token);
    setEstado('Login exitoso. Token client guardado en localStorage.', data);
    await autoFillClientIdFromMe();
  } catch (error) {
    setEstado('Error en login:', error.message);
  }
});

document.querySelector('#btnMe').addEventListener('click', autoFillClientIdFromMe);

document.querySelector('#btnLogout').addEventListener('click', () => {
  clearToken();
  setEstado('Sesion cerrada.', 'Token eliminado de localStorage.');
});

document.querySelector('#btnCreateOrder').addEventListener('click', async () => {
  try {
    const payload = {
      clienteId: Number(ui.createClienteId.value),
      lineas: parseJsonOrThrow(ui.createLineas.value)
    };

    const data = await api('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true);

    if (data?.data?.order?.id) {
      ui.orderId.value = String(data.data.order.id);
    }

    setEstado('Pedido creado:', data);
  } catch (error) {
    setEstado('Error creando pedido:', error.message);
  }
});

document.querySelector('#btnListOrders').addEventListener('click', async () => {
  try {
    const clienteId = Number(ui.listClienteId.value);
    const data = await api(`/api/v1/orders?clienteId=${clienteId}&page=1&pageSize=20`, {
      method: 'GET'
    }, true);
    setEstado('Listado de pedidos:', data);
  } catch (error) {
    setEstado('Error listando pedidos:', error.message);
  }
});

document.querySelector('#btnGetOrder').addEventListener('click', async () => {
  try {
    const orderId = Number(ui.orderId.value);
    const data = await api(`/api/v1/orders/${orderId}`, {
      method: 'GET'
    }, true);

    const primeraLinea = data?.data?.lineas?.[0];
    if (primeraLinea?.id) {
      ui.lineId.value = String(primeraLinea.id);
      ui.version.value = String(primeraLinea.version || 0);
    }

    renderLineasDisponibles(data);

    setEstado('Detalle de pedido:', data);
  } catch (error) {
    setEstado('Error consultando detalle:', error.message);
  }
});

document.querySelector('#btnUpdateProgress').addEventListener('click', async () => {
  try {
    const orderId = Number(ui.orderId.value);
    const lineId = Number(ui.lineId.value);
    if (!Number.isFinite(orderId) || !Number.isFinite(lineId) || orderId <= 0 || lineId <= 0) {
      throw new Error('Order ID y Line ID deben ser numeros positivos.');
    }

    const payload = {
      deltaProcesadas: Number(ui.deltaProcesadas.value),
      deltaRechazadas: Number(ui.deltaRechazadas.value),
      version: Number(ui.version.value)
    };

    const data = await api(`/api/v1/orders/${orderId}/lines/${lineId}/progress`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true);

    const lineaActualizada = (data?.data?.lineas || []).find((linea) => Number(linea.id) === lineId);
    if (lineaActualizada) {
      ui.version.value = String(lineaActualizada.version || payload.version);
    }
    renderLineasDisponibles(data);

    setEstado('Progreso actualizado:', data);
  } catch (error) {
    setEstado('Error actualizando progreso:', error.message);
  }
});

document.querySelector('#btnCancelLine').addEventListener('click', async () => {
  try {
    const orderId = Number(ui.orderId.value);
    const lineId = Number(ui.lineId.value);
    if (!Number.isFinite(orderId) || !Number.isFinite(lineId) || orderId <= 0 || lineId <= 0) {
      throw new Error('Order ID y Line ID deben ser numeros positivos.');
    }

    const data = await api(`/api/v1/orders/${orderId}/lines/${lineId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({})
    }, true);

    const lineaActualizada = (data?.data?.lineas || []).find((linea) => Number(linea.id) === lineId);
    if (lineaActualizada) {
      ui.version.value = String(lineaActualizada.version || ui.version.value);
    }
    renderLineasDisponibles(data);

    setEstado('Linea cancelada:', data);
  } catch (error) {
    setEstado('Error cancelando linea:', error.message);
  }
});

if (getToken()) {
  autoFillClientIdFromMe();
}
