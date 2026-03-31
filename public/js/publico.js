const socket = io();

const productoPrincipal = document.querySelector('#productoPrincipal');
const monitorPrincipal = document.querySelector('#monitorPrincipal');
const estadoPrincipal = document.querySelector('#estadoPrincipal');
const lista = document.querySelector('#listaRevisiones');

socket.on('ultimas-revisiones', (revisiones) => {
 if (!revisiones.length) {
  productoPrincipal.innerText = 'Sin revisiones';
  monitorPrincipal.innerText = '';
  estadoPrincipal.innerText = '';
  lista.innerHTML = '';
  return;
 }

 const [primero, ...resto] = revisiones;

 productoPrincipal.innerText = `Paso #${primero.idPaso} - ${primero.modelo.tipo}`;
 monitorPrincipal.innerText = `QR medido: ${primero.modelo.qrMedido} | Monitor: ${primero.monitor.nombre} (Canal ${primero.monitor.canal})`;
 estadoPrincipal.innerText = primero.aprobado ? 'APROBADO' : 'RECHAZADO';

 lista.innerHTML = '';

 resto.forEach((item) => {
  lista.innerHTML += `
   <div class="item">
    <strong>Paso #${item.idPaso} - ${item.modelo.tipo}</strong><br>
    QR medido: ${item.modelo.qrMedido}<br>
    Monitor: ${item.monitor.nombre}<br>
    <span class="badge ${item.aprobado ? 'ok' : 'fail'}">${item.aprobado ? 'Aprobado' : 'Rechazado'}</span>
   </div>
  `;
 });
});
