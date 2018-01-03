const mongoose = require('mongoose');

const StageThree = new mongoose.Schema({
  source: String,
  
});

module.exports = mongoose.model('StageThree', StageThree);
