const mongoose = require('mongoose');

module.exports = mongoose.model('depositos', {
    hash: String,
    wallet: String,
    tipo: String,
    completado: Boolean,
    payAt: Number,
    balance: Number,
    pais: String

});