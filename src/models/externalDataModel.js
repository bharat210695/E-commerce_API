const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    data: { type: Array, default: [] },
  },
  { collection: "external_data", versionKey: false },
  { timestamps: true }
);

module.exports = mongoose.model("External_Data", schema);
