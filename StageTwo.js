const mongoose = require('mongoose');

const StageTwo = new mongoose.Schema({
  pid: String,
  amount: Number,
  urls: [],
  gotLinksForPage: {type: Boolean, default: false},
  placesCollected: {type: Boolean, default: false}
});

module.exports = mongoose.model('StageTwo', StageTwo);
