const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },

    vendorId: { type: String, required: true },
    vendorName: { type: String, required: true },

    deliveryPartnerId: { type: String },
    deliveryPartnerName: { type: String },
    deliveryPartnerOtp: { type: Number, min: 1000, max: 9999 },
    daysForDelivery: { type: Number, default: null },
    customerName: { type: String, required: true },
    customerId: { type: String, required: true },
    customerPhoneNo: { type: String },
    customerEmail: {
      type: String,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      lowercase: true,
      // required: true,
    },
    customerAddress: { type: Object, required: true },
    vendorAddress: { type: Object, required: true },
    customerOtp: { type: Number, min: 1000, max: 9999 },
    productId: { type: String, required: true },
    product: { type: Object, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "packed",
        "dispatched",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "return-request",
      ],
      default: "pending",
      required: true,
    },
    cancelledBy: {
      type: String,
      enum: ["", "user", "vendor", "delivery-partner"],
      default: "",
    },

    returnStatus: {
      type: String,
      default: "",
      enum: [
        "",
        "pending",
        "processing",
        "out-for-pickup",
        "picked",
        "returned",
        "rejected",
      ],
    },

    returnRefundStatus: { type: String, enum: ["pending", "paid"] },

    reasonForReturnRequest: {
      type: String,
      enum: ["1", "2", "3"],
    },
    //1 - Damaged or Wrong Product
    //2 - Wrong Size
    //3 - Issue with Quality

    couponApplied: { type: Array, default: [] },
    couponDiscount: { type: Number, default: 0 },

    deliveryType: { type: String, enum: ["agent", "courier"], required: true },
    trackingId: { type: String, default: "" },
    deliveryFee: { type: Number, default: "" },

    invoiceUrl: { type: String, default: "" },

    paymentMode: { type: String, required: true },
    gstAmount: { type: Number, required: true },

    qty: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    price: { type: Number, required: true },
    totalPrice: { type: Number, required: true }, // price * qty
    netAmount: { type: Number, required: true }, //totalPrice - deliveryFee
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
