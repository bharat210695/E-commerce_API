const mongoose = require("mongoose");
const auditSchema = new mongoose.Schema(
  {
    collectionType: {
      type: String,
      required: true,
      enum: ["vendor", "delivery-partner"],
    },
    uid: {
      type: String,
      required: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    codPaymentTotalOrders: {
      type: Number,
      required: true,
    },
    offlinePaymentTotalOrders: {
      type: Number,
      required: true,
    },
    codPaymentNetAmount: {
      type: Number,
      required: true,
    },
    offlinePaymentNetAmount: {
      type: Number,
      required: true,
    },
    codPaymentWemShare: {
      type: Number,
      required: true,
    },
    offlinePaymentWemShare: {
      type: Number,
      required: true,
    },
    codPaymentPartnerShare: {
      type: Number,
      required: true,
    },
    offlinePaymentPartnerShare: {
      type: Number,
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("audit", auditSchema);
