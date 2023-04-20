const mongoose = require("mongoose");
const sponsoredHistorySchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    from: {
      type: Date,
    },
    to: {
      type: Date,
    },
    days: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "active", "expired", "rejected"],
      default: "pending",
    },
    fee: {
      type: Number,
      required: true,
    },
    products: {
      type: Array,
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("sponsored_history", sponsoredHistorySchema);
