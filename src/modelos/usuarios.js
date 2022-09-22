const mongoose = require('mongoose');

module.exports = mongoose.model('usuarios', {
    wallet: String,
    email: String,
    password: String,
    username: String,
    active: Boolean,
    payAt: Number,
    checkpoint: Number,
    reclamado: Boolean,
    balance: Number,
    txs: [String],
    pais: String,
    imagen: String,
    wcscExchange: Number,
    balanceUSD: Number

});