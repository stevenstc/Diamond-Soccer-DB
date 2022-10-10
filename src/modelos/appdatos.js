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
  ligaCosto: Number,
  precioAvatar: Number,
  onOffServers: [Boolean],
  entrenamiento: Number,
  plaformaWin: Boolean,
  plaformaAnd: Boolean,
  plaformaWeb: Boolean,
  diponibleDiaria: Number,
  disponibleDiariaMES: Number,
  cantidadPersonasDiaria: Number

});