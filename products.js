const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  card: String,
  0: String,
  1: String,
  _id: mongoose.Schema.Types.ObjectId,
  desp: String,
  full_desp: String,
  rating: Number,
});

module.exports = mongoose.model("Products", userSchema);
