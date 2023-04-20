const mongoose = require("mongoose");

const faucetPayAddressesSchema = new mongoose.Schema({
  addresses: {
    type: Array,
    required: true,
  },
  coinSymbol: {
    type: String,
    required: true,
  },
  createdAt: { type: Date },
});

module.exports = mongoose.model(
  "faucet_pay_addresses",
  faucetPayAddressesSchema
);
