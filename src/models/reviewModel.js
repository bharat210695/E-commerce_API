const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    productId: {
      type: ObjectId,
      ref: "Product",
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      //ref: "Order",
      required: true,
      unique: true,
      trim: true,
    },
    vendorId: {
      type: ObjectId,
      ref: "Vendor",
      required: true,
      trim: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "" },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Reviews", reviewSchema);
