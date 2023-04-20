const userModel = require("../models/userModel");
const vendorModel = require("../models/vendorModel");
const deliveryPartnerModel = require("../models/deliveryPartnerModel");
const { default: mongoose } = require("mongoose");

const checkUserExists = async (value, type) => {
  if (type === "email") {
    let userExists = await userModel.findOne({ email: value });
    return userExists;
  } else if (type === "id") {
    let userExists = await userModel.findById(mongoose.Types.ObjectId(value));
    return userExists;
  } else if (type === "phone") {
    let userExists = await userModel.findOne({ phone: value });
    return userExists;
  }
};
const checkVendorExists = async (value, type) => {
  if (type === "email") {
    let vendorExists = await vendorModel.findOne({ email: value });
    return vendorExists;
  } else if (type === "id") {

    let vendorExists = await vendorModel.findOne({ _id: value });

    return vendorExists;
  } else if (type === "phone") {
    let vendorExists = await vendorModel.findOne({ phone: value });
    return vendorExists;
  }
};
const checkDeliveryPartnerExists = async (value, type) => {
  if (type === "email") {
    let deliveryPartnerExists = await deliveryPartnerModel.findOne({
      email: value,
    });
    return deliveryPartnerExists;
  } else if (type === "id") {
    let deliveryPartnerExists = await deliveryPartnerModel.findById(
      mongoose.Types.ObjectId(value)
    );
    return deliveryPartnerExists;
  } else if (type === "phone") {
    let deliveryPartnerExists = await deliveryPartnerModel.findOne({
      phone: value,
    });
    return deliveryPartnerExists;
  }
};

module.exports = {
  checkUserExists,
  checkVendorExists,
  checkDeliveryPartnerExists,
};
