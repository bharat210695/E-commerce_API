const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const DeliveryPartnerModel = require("../../models/deliveryPartnerModel");

const bcrypt = require("bcryptjs");
const orderModel = require("../../models/orderModel");
const salt = bcrypt.genSaltSync(10);

//##################### CREATE DELIVERY PARTNER #######################
const addNewDeliveryPartner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { name, email, phone, password, address, cities } = req.body;
    const isEmailAlreadyExist = await DeliveryPartnerModel.findOne({
      email: email.toLowerCase(),
    });

    if (isEmailAlreadyExist) {
      return next(createError(406, "Email id is already exists!"));
    }
    const isPhoneAlreadyExist = await DeliveryPartnerModel.findOne({
      phone: phone,
    });

    if (isPhoneAlreadyExist) {
      return next(createError(406, "Phone number is already exists!"));
    }

    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password
    const modifiedAddress = { ...address, _id: new mongoose.Types.ObjectId() };
    const deliveryPartner = {
      name: name,
      email: email,
      phone: phone,
      password: encryptedPassword,
      cities: cities,
      addresses: address ? [modifiedAddress] : [],
      defaultAddress: modifiedAddress._id,
    };
    let newDeliveryPartner = await DeliveryPartnerModel.create(deliveryPartner);

    return res.status(201).json({
      status: true,
      message: "Delivery Partner Added!",
      data: newDeliveryPartner,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//##################### UPDATE DELIVERY PARTNER #######################
const updateDeliveryPartner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id, name, email, phone, password, address, cities } = req.body;
    const deliveryPartnerExists = await DeliveryPartnerModel.findOne({
      _id: id,
    });

    if (!deliveryPartnerExists) {
      return next(createError(406, "Delivery Partner Does not Exist!"));
    }
    let deliveryPartner = {};
    let encryptedPassword = "";
    if (password) {
      encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password
      deliveryPartner.password = encryptedPassword;
    }

    const modifiedAddress = { ...address, _id: new mongoose.Types.ObjectId() };
    let deliveryPartnerObject = {
      name: name,
      email: email,
      phone: phone,

      cities: cities,
      addresses: address ? [modifiedAddress] : [],
      defaultAddress: modifiedAddress._id,
    };
    deliveryPartner = { ...deliveryPartner, ...deliveryPartnerObject };
    console.log("deliveryPartner", deliveryPartner);
    let updateInfo = await DeliveryPartnerModel.updateOne(
      { _id: id },
      deliveryPartner
    );

    if (updateInfo.modifiedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }

    return res.status(201).json({
      status: true,
      message: "Delivery Partner Updated!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## GET ALL DELIVERY PARTNERS ##############################
const getAllDeliveryPartner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const deliveryPartner = await DeliveryPartnerModel.find(
      {},
      { password: 0 }
    );

    if (!deliveryPartner) {
      return next(createError(406, "No Delivery Partners Found!"));
    }

    return res.status(200).json({
      status: true,
      data: deliveryPartner,
    });
  } catch (err) {
    return next(createError(401, err.message));
  }
};

// ############################## GET DELIVERY PARTNER DETAILS BY ID ##############################
const getDeliveryPartnerById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { deliveryPartnerId } = req.params;

    const deliveryPartner = await DeliveryPartnerModel.findById(
      mongoose.Types.ObjectId(deliveryPartnerId),
      { password: 0 }
    );

    if (!deliveryPartner) {
      return next(createError(401, "Delivery Partner Does not Exist!"));
    }
    let completedOrders = await orderModel
      .find({
        deliveryPartnerId: deliveryPartnerId,
        status: "delivered",
      })
      .countDocuments();
    let pendingOrders = await orderModel
      .find({
        deliveryPartnerId: deliveryPartnerId,
        status: {
          $in: ["pending", "packed", "dispatched", "out-for-delivery"],
        },
      })
      .countDocuments();

    return res.status(200).json({
      status: true,
      data: { deliveryPartner, completedOrders, pendingOrders },
    });
  } catch (err) {
    return next(createError(401, err.message));
  }
};

// ############################## BLOCK DELIVERY PARTNER  BY ID ##############################
const blockDeliveryPartnerById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { deliveryPartnerId } = req.params;

    const deliveryPartner = await DeliveryPartnerModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(deliveryPartnerId),
      },
      { disabled: true }
    );

    if (deliveryPartner.modifiedCount !== 1) {
      return next(createError(401, "Some Error Occured!"));
    }

    return res
      .status(200)
      .json({ status: true, message: "Delivery Partner Blocked!" });
  } catch (err) {
    return next(createError(401, err.message));
  }
};

// ############################## UN-BLOCK DELIVERY PARTNER  BY ID ##############################
const unBlockDeliveryPartnerById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { deliveryPartnerId } = req.params;

    const deliveryPartner = await DeliveryPartnerModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(deliveryPartnerId),
      },
      { disabled: false, loginAttemptsLeft: 3 }
    );

    if (deliveryPartner.modifiedCount !== 1) {
      return next(createError(401, "Some Error Occured!"));
    }
    return res
      .status(200)
      .json({ status: true, message: "Delivery Partner Unblocked!" });
  } catch (err) {
    return next(createError(401, err.message));
  }
};

// ############################## ADD DELIVERY CHARGES TO DELIVERY PARTNER ##############################
const deleteDeliveryPartner = async (req, res, next) => {
  try {
    const { deliveryPartnerId } = req.params;

    let hasAtleastOneOrder = await orderModel.find({
      deliveryPartnerId: deliveryPartnerId,
    });

    console.log("hasAtleastOneOrder", hasAtleastOneOrder);
    if (hasAtleastOneOrder.length > 0) {
      return next(
        createError(
          401,
          "Cannot Delete When Delivery Partner is involved in any order! Try Blocking Instead!"
        )
      );
    }

    await DeliveryPartnerModel.deleteOne({
      _id: mongoose.Types.ObjectId(deliveryPartnerId),
    });
    return res
      .status(200)
      .json({ status: true, message: "Delivery Partner Deleted!" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## ADD DELIVERY CHARGES TO DELIVERY PARTNER ##############################
const addDeliveryCharges = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { deliveryPartnerId, charges } = req.body;
    await DeliveryPartnerModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(deliveryPartnerId),
      },
      {
        $set: { charges: charges },
      }
    );
    return res.status(200).json({ status: true, message: "Success!" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  addNewDeliveryPartner,
  updateDeliveryPartner,
  getAllDeliveryPartner,
  getDeliveryPartnerById,
  blockDeliveryPartnerById,
  unBlockDeliveryPartnerById,
  addDeliveryCharges,
  deleteDeliveryPartner,
};
