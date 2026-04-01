const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  message: String,
});

module.exports = mongoose.model("Test", testSchema);