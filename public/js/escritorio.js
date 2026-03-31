const socket = io();

const revision = document.querySelector('#revision');
const btn = document.querySelector('#btnRevisar');
const pendientes = document.querySelector('#pendientes');

const monitorId = prompt('ID del monitor de proceso');
document.querySelector('#titulo').innerText = `Monitor ${monitorId}`;

socket.on('pasos-pendientes', (numero) => {
 pendientes.innerText = numero;
});

btn.addEventListener('click', () => {
 socket.emit('revisar-siguiente-producto', { monitorId }, (res) => {
  if (!res.revision) {
   revision.innerText = 'No hay productos pendientes';
   return;
  }

  const item = res.revision;
  revision.innerText = [
   `Paso: ${item.idPaso}`,
   `Modelo ideal: ${item.modelo.tipo}`,
   `QR medido: ${item.modelo.qrMedido}`,
   `Monitor: ${item.monitor.nombre}`,
   `Canal: ${item.canal}`,
   `Resultado: ${item.aprobado ? 'Aprobado' : 'Rechazado'}`,
   `Checks: peso=${item.resultado.pesoOk}, color=${item.resultado.colorOk}, altura=${item.resultado.alturaOk}`
  ].join('\n');
 });
});
