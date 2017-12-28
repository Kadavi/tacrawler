const mongoose = require('mongoose');

const StageTwo = new mongoose.Schema({
  pid: String,
  amount: Number,
  urls: []
});

module.exports = mongoose.model('StageTwo', StageTwo);
