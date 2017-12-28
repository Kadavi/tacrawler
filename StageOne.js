const mongoose = require('mongoose');

const StageOne = new mongoose.Schema({
  pid: Number,
  amount: Number,
  urls: []
});

module.exports = mongoose.model('StageOne', StageOne);
