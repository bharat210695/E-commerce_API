const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  landmark: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: Number, required: true, min: 6 },
  state: { type: String, required: true },
  phone: {
    type: String,
    trim: true,
  },
});
const cartSchema = new mongoose.Schema({
  productId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, default: 1 },
  colorId: { type: Schema.Types.ObjectId, required: true },
  sizeId: { type: Schema.Types.ObjectId, required: true },
});

const subscriptionSchema = new mongoose.Schema({
  vendorId: { type: String },
  showNotifications: { type: Boolean, default: true },
});
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      lowercase: true,
    },
    password: { type: String, required: true, min: 8, max: 15, default: "" },
    loginAttemptsLeft: { type: Number, default: 3 },
    disabled: { type: Boolean, default: false },
    birthday: { type: String, format: Date, default: "" },
    lastLogin: { type: Date, default: Date.now },
    gender: { type: String, default: "" },
    cart: { type: [cartSchema], default: [] },
    cartQty: { type: Number, default: 0 },
    wishlist: { type: Array, default: [] },
    wishlistQty: { type: Number, default: 0 },
    bought: { type: Number, default: 0 },
    addresses: { type: [addressSchema], default: [] },
    defaultAddress: { type: String, default: "" },
    image: { type: String, default: "" },
    imageFileId: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    totalprice: { type: Number, default: 0 },
    isPhoneValidated: { type: Boolean, default: false },
    isEmailValidated: { type: Boolean, default: false },
    phone: {
      type: String,
      trim: true,
    },
    orders: { type: Array, default: [] },
    subscriptions: { type: [subscriptionSchema], default: [] },
  },
  { versionKey: false, timestamps: true }
);

// password
userSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
