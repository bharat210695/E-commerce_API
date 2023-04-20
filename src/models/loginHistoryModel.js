const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loginHistorySchema = new Schema(
  {
    email: { type: String, lowercase: true },
    phone: { type: String, lowercase: true },
    uid: { type: String, required: true },
    ipAddress: { type: String, required: true },
    loginDate: { type: Date, default: Date.now },
    status: { type: Boolean, required: true },
    userType: {
      type: String,
      required: true,
      lowercase: true,
      enum: ["vendor", "admin", "courier", "client"],
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("login_history", loginHistorySchema);
