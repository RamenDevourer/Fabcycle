const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    card: String,
    _id: mongoose.Schema.Types.ObjectId,
    rating: Number,
    headline: String,
    review: String,
    username: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reviews", userSchema);
