const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: String,
  password: String,
  // user data
  firstName: String,
  lastName: String,
  email: String,
  address: String,
  adress2: String,
  country: String,
  state: String,
  pinCode: Number,
  // Product
  card1: {
    type: Number,
    default: 0,
  },
  card2: {
    type: Number,
    default: 0,
  },
  card3: {
    type: Number,
    default: 0,
  },
  card4: {
    type: Number,
    default: 0,
  },
  card5: {
    type: Number,
    default: 0,
  },
  card6: {
    type: Number,
    default: 0,
  },
  card7: {
    type: Number,
    default: 0,
  },
  card8: {
    type: Number,
    default: 0,
  },
  card9: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("UserLogin", userSchema);
