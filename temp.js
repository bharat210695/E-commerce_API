const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    auditType: { type: String, enum: ["doctor", "test"], required: true },
    partnerId: { type: String, required: true },
    partnerName: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    totalMrp: { type: Number, required: true },
    totalJiwanCareCodShare: { type: Number, required: true },
    totalJiwanCareOnlineShare: { type: Number, required: true },
    totalPartnerCodShare: { type: Number, required: true },
    totalPartnerOnlineShare: { type: Number, required: true },
    totalCodBookings: { type: Number, required: true },
    totalOnlineBookings: { type: Number, required: true },
    from: { type: String },
    to: { type: String },
    bookings: { type: Array },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Audits", auditSchema);
