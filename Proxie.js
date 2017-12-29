const mongoose = require('mongoose');

const Proxie = new mongoose.Schema({
  ip: String,
  port: Number
});

module.exports = mongoose.model('Proxie', Proxie);
