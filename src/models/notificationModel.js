const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  seen: { type: Boolean, default: false },
});
const notificationSchema = new mongoose.Schema(
  {
    vendorId: { type: String },
    type: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    subscribers: { type: [usersSchema], default: [] },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("notification", notificationSchema);
