const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  landmark: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: Number, required: true, min: 6 },
  state: { type: String, required: true },
});
const chargesSchema = new mongoose.Schema({
  shipFrom: { type: String, required: true },
  shipTo: { type: String, required: true },
  charge: { type: Number, required: true },
  days: { type: Number, require: true },
});
const deliveryPartner = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      lowercase: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
      match: [
        /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
        "Please fill valid indian phone number",
      ],
      trim: true,
    },
    password: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    loginAttemptsLeft: { type: Number, default: 3 },
    addresses: { type: [addressSchema], default: [] },
    defaultAddress: { type: String },
    cities: { type: Array, default: [] },
    completedDeliveries: { type: Number, default: 0 },
    pendingDeliveries: { type: Number, default: 0 },
    charges: { type: [chargesSchema], default: [] },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("delivery_partner", deliveryPartner);
