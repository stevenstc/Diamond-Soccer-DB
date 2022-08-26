const mongoose = require('mongoose');

module.exports = mongoose.model('userplayonline', {
  identificador: Number,
  sesionID: String,
  incio: Number,
  fin: Number,
  finalizada: Boolean,
  ganador: String,
  tipo: String,
  saqueInicial: String,
  turno: String,
  csc: String,
  u1: String,
  u2: String,
  soporte1: String,
  soporte2: String,
  goles1: String,
  goles2: String
  
});