const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  subCategory: {
    type: String,
    required: true,
  },
  parent: {
    type: String,
    required: true,
  },
});
const categorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
    },
    subCategories: {
      type: [subCategorySchema],
      default: [],
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("category", categorySchema);
