const mongoose = require('mongoose');

module.exports = mongoose.model('appdatos', {

  entregado: Number,
  ganado: Number, 
  ganadoliga: Number,
  misiondiaria: Boolean,
  finliga: Number,
  valorDiaria: Number,
  objetivosDiaria: [Number],
  cscSalas: [Number],
  maximoCSC: Number,
  ligaCosto: Number

});