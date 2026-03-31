const socket = io();

const tipoIdealInput = document.querySelector('#tipoIdeal');
const qrIdealInput = document.querySelector('#qrIdeal');
const pesoIdealInput = document.querySelector('#pesoIdeal');
const colorIdealInput = document.querySelector('#colorIdeal');
const alturaIdealInput = document.querySelector('#alturaIdeal');
const btnCrearModelo = document.querySelector('#btnCrearModelo');
const resultadoModelo = document.querySelector('#resultadoModelo');

const qrInput = document.querySelector('#qr');
const modeloReferenciaInput = document.querySelector('#modeloReferencia');
const pesoInput = document.querySelector('#peso');
const colorInput = document.querySelector('#color');
const alturaInput = document.querySelector('#altura');
const canalInput = document.querySelector('#canal');
const resultado = document.querySelector('#resultado');
const btnRegistrar = document.querySelector('#btnRegistrar');

btnCrearModelo.addEventListener('click', () => {
 const payload = {
  tipo: tipoIdealInput.value.trim(),
  qr: qrIdealInput.value.trim(),
  pesoEsperado: Number(pesoIdealInput.value),
  colorEsperado: colorIdealInput.value.trim(),
  alturaEsperada: Number(alturaIdealInput.value)
 };

 socket.emit('crear-modelo-producto', payload, (res) => {
  if (!res.ok) {
   resultadoModelo.innerText = `❌ ${res.msg}`;
   return;
  }

  resultadoModelo.innerText = `✅ Modelo ideal creado: ${res.modelo.tipo} (id ${res.modelo.id})`;
 });
});

btnRegistrar.addEventListener('click', () => {
 const payload = {
  qr: qrInput.value.trim(),
  modeloReferencia: modeloReferenciaInput.value.trim() || null,
  peso: Number(pesoInput.value),
  color: colorInput.value.trim(),
  altura: Number(alturaInput.value),
  canal: canalInput.value.trim() || '1'
 };

 socket.emit('registrar-paso-producto', payload, (res) => {
  if (!res.ok) {
   resultado.innerText = `❌ ${res.msg}`;
   return;
  }

  resultado.innerText = `✅ Paso #${res.paso.idPaso} registrado. QR medido: ${res.paso.modelo.qrMedido} | Modelo ideal: ${res.paso.modelo.tipo}`;
 });
});
