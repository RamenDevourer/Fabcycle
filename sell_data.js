const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  address: String,
  adress2: String,
  country: String,
  state: String,
  pinCode: Number,
  useSavedAddress: mongoose.Schema.Types.Mixed,
  reward: mongoose.Schema.Types.Mixed,
  fabricType: String,
  condition: String,
});

module.exports = mongoose.model("UserSell", userSchema);
