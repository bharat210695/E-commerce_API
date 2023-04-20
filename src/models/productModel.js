const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sizeSchema = new mongoose.Schema({
  size: { type: String, lowercase: true, required: true },
  qty: { type: Number, lowercase: true, default: 0 },
  price: { type: Number, lowercase: true, default: 0 },
});
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  imageFileId: { type: String, required: true },
});
const attributeSchema = new mongoose.Schema({
  color: { type: String, required: true, lowercase: true, trim: true },
  colorCode: { type: String, lowercase: true, trim: true },
  sizes: { type: [sizeSchema] },
  images: { type: [imageSchema] },
});
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "", lowercase: true, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      // ref: "category",
    },
    subCategoryId: { type: String, required: true },

    type: { type: String },
    gender: { type: String, default: "" },

    ratingData: { type: Object, default: { rating: 0, count: 0 } },
    rating: { type: Number, default: 5 },

    discount: { type: Number, default: 0 },
    defaultPrice: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },

    // attributes: { type: Array, default: [] },
    attributes: { type: [attributeSchema], default: [] },
    defaultImage: { type: Array, default: [] },

    vendorId: { type: String, default: "" },
    brandName: { type: String, default: "" },
    sponsored: { type: Boolean, default: false },
    allowReturn: { type: Boolean, default: true },
    status: {
      type: String,
      lowercase: true,
      enum: ["active", "disabled", "hidden"],
      default: "active",

      //disabled = admin disabled the product
      //hidden = vendor temporary disabled/hide/delist the product
    },
    // allowCod: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now() },
    sizeFormat: {
      type: String,
      required: true,
      enum: ["0", "1", "2"],
      //0 = default
      //1 = footwear
      //2 = waist
    },
  },
  { versionKey: false, timestamps: true, toJSON: { virtuals: true } }
);
productSchema.virtual("cateogry", {
  ref: "category",
  localField: "categoryId",
  foreignField: "_id",
});
module.exports = mongoose.model("Product", productSchema);
