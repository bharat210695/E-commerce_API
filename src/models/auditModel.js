const mongoose = require("mongoose");

const ordersSchema = new mongoose.Schema({
  orderId: {
    type: String,
  },
  orderDate: {
    type: Date,
  },
  username: {
    type: String,
  },
  totalItems: {
    type: Number,
  },
  netAmount: {
    type: Number,
  },
});
const auditSchema = new mongoose.Schema(
  {
    auditType: {
      type: String,
      required: true,
      enum: ["vendor", "delivery-partner"],
    },
    vendorId: {
      type: String,
      default: "",
    },
    deliveryPartnerId: {
      type: String,
      default: "",
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
    onlinePaymentTotalOrders: {
      type: Number,
      required: true,
    },
    codPaymentTotalPrice: {
      required: true,
      type: Number,
    },
    onlinePaymentTotalPrice: {
      required: true,
      type: Number,
    },
    codPaymentNetAmount: {
      required: true,
      type: Number,
    },
    onlinePaymentNetAmount: {
      required: true,
      type: Number,
    },
    codPaymentWemShare: {
      type: Number,
    },
    onlinePaymentWemShare: {
      type: Number,
    },
    codPaymentVendorShare: {
      type: Number,
    },
    onlinePaymentVendorShare: {
      type: Number,
    },
    codPaymentDeliveryPartnerShare: {
      type: Number,
    },
    onlinePaymentDeliveryPartnerShare: {
      type: Number,
    },
    resolved: {
      type: Boolean,
      required: true,
      default: false,
    },
    orders: {
      type: Array,
      default: [{ ordersSchema }],
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("audit", auditSchema);
