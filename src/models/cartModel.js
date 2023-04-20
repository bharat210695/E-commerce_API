const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productDetailsSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  brandName: { type: String, required: true },
  size: { type: String, required: true },
  colorCode: { type: String, required: true },
  color: { type: String, required: true },
});
const cartSchema = new mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    productId: { type: Schema.Types.ObjectId, required: true },
    vendorId: { type: Schema.Types.ObjectId, required: true },
    qty: { type: Number, default: 1 },
    colorId: { type: Schema.Types.ObjectId, required: true },
    sizeId: { type: Schema.Types.ObjectId, required: true },
    productDetails: { type: productDetailsSchema, required: true },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
