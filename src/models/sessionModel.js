const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  sessionToken: {
    type: String,
    required: true,
  },
  otp: {
    type: Number,
  },

  createdAt: { type: Date },
});

sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model("session", sessionSchema);
