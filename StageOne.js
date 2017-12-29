const mongoose = require('mongoose');

const StageOne = new mongoose.Schema({
  pid: Number,
  amount: Number,
  urls: [],
  gotPaginationAmount: {
    type: Boolean, 
    default: false
  }
});

module.exports = mongoose.model('StageOne', StageOne);
