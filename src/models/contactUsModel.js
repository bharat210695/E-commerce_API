const mongoose = require("mongoose");

const contactUsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("contact_us", contactUsSchema);
