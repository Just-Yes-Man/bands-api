class Ticket {

 constructor(numero, escritorio = null) {
  this.numero = numero;
  this.escritorio = escritorio;
 }

}

class TicketControl {

 constructor() {

  this.ultimo = 0;
  this.tickets = [];
  this.ultimos4 = [];

 }

 siguiente() {

  this.ultimo += 1;

  const ticket = new Ticket(this.ultimo);

  this.tickets.push(ticket);

  return `Ticket ${ticket.numero}`;

 }

 atenderTicket(escritorio) {

  if (this.tickets.length === 0) {
   return null;
  }

  const ticket = this.tickets.shift();

  ticket.escritorio = escritorio;

  this.ultimos4.unshift(ticket);

  if (this.ultimos4.length > 4) {
   this.ultimos4.splice(-1, 1);
  }

  return ticket;

 }

}

module.exports = TicketControl;
