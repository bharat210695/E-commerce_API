const mongoose = require("mongoose");
const addressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  landmark: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: Number, required: true, min: 6 },
  state: { type: String, required: true },
});
const vendorSchema = new mongoose.Schema(
  {
    name: { type: String },
    storeName: { type: String, default: "" },
    address: { type: addressSchema },
    city: { type: String, default: "" },
    // defaultAddress: { type: String },
    status: {
      type: String,
      enum: ["registered", "pending", "approved", "rejected", "disabled"],
      default: "registered",
    },
    reasonForRejection: { type: String },
    aadharNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    aadharFrontImage: { type: String, default: "" },
    aadharFrontFileId: { type: String, default: "" },
    aadharBackImage: { type: String, default: "" },
    aadharBackFileId: { type: String, default: "" },
    panImage: { type: String, default: "" },
    panFileId: { type: String, default: "" },
    image: { type: String, default: "" },
    imageFileId: { type: String, default: "" },
    isEmailValidated: { type: Boolean, default: false },
    completedOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    ratingData: { type: Object, default: { rating: 0, count: 0 } },
    rating: { type: Number },

    role: {
      type: String,
      required: true,
      lowercase: true,
      enum: ["primary", "secondary", "read-only"],
      default: "read-only",
    },

    email: {
      type: String,
      trim: true,
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
    password: { type: String, required: true, min: 8, max: 15 },
    loginAttemptsLeft: { type: Number, default: 3 },
    subscribers: { type: Array, default: [] },
    deliveryCharge: { type: Number, default: 100 },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
