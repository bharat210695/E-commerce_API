const { validationResult } = require("express-validator");
const createError = require("http-errors");
const UserModel = require("../../models/userModel");
const { default: mongoose } = require("mongoose");
const userModel = require("../../models/userModel");

//######################### GET USER ADDRESSES BY USERID  ###################################
const getAddressesByID = async (req, res, next) => {
  try {
    let { id } = req.user;
    let user = await UserModel.findOne(
      {
        _id: mongoose.Types.ObjectId(id),
      },
      { addresses: 1, _id: 0, defaultAddress: 1 }
    );

    return res.status(200).json({
      status: true,
      message: "success",
      data: {
        addresses: user ? user.addresses : [],
        defaultAddress: user ? user.defaultAddress : "",
      },
    });
  } catch (err) {
    return next(createError(500, err.message));
  }
};

//######################### USER ADD ADDRESS ###################################
const addNewAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const { address, landmark, city, state, pincode, phone } = req.body;
    let user = await userModel.findOne({ _id: id });
    const newAddress = {
      address,
      landmark,
      city,
      state,
      pincode,
      phone,
      _id: new mongoose.Types.ObjectId(),
    };
    let addAddress = null;
    if (user.addresses.length === 0) {
      addAddress = await UserModel.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(id),
        },
        {
          $push: {
            addresses: newAddress,
          },
          defaultAddress: newAddress._id,
        },
        { new: true }
      );
    } else {
      addAddress = await UserModel.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(id),
        },
        {
          $push: {
            addresses: newAddress,
          },
        },
        { new: true }
      );
    }
    if (!addAddress) {
      return next(createError(500, "Failed to add new address!"));
    }

    return res.status(200).json({
      message: "success",
      data: {
        address: addAddress.addresses,
        defaultAddress: addAddress.defaultAddress,
      },
    });
  } catch (err) {
    return next(createError(500, err.message));
  }
};

//######################### DELETE USER ADDRESS ###################################
const deleteUserAddress = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { addressId } = req.params;

    const user = await UserModel.findOne({ _id: mongoose.Types.ObjectId(id) });

    if (user) {
      const updatedUserAddresses = user.addresses.filter(
        (address) => address._id.toHexString() !== addressId
      );
      user.addresses = updatedUserAddresses;

      if (user.defaultAddress === addressId) {
        user.defaultAddress =
          updatedUserAddresses.length > 0
            ? updatedUserAddresses[
                updatedUserAddresses.length - 1
              ]._id.toHexString()
            : "";
      }

      await user.save();

      return res.status(200).json({
        message: "success",
        data: {
          addresses: user.addresses,
          defaultAddress: user.defaultAddress,
        },
      });
    }
    return next(createError(404, "User not found!"));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

//######################### USER UPDATE ADDRESS ###################################
const updateAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const { address, landmark, city, state, pincode, addressId, phone } =
      req.body;

    const user = await UserModel.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(id),
        "addresses._id": mongoose.Types.ObjectId(addressId),
      },
      {
        $set: {
          "addresses.$.address": address,
          "addresses.$.landmark": landmark,
          "addresses.$.city": city,
          "addresses.$.state": state,
          "addresses.$.pincode": pincode,
          "addresses.$.phone": phone,
        },
      },
      { new: true }
    );
    if (!user) {
      return next(createError(500, "Failed to update address!"));
    }

    return res.status(200).json({ message: "success", data: user.addresses });
  } catch (err) {
    return next(createError(500, err.message));
  }
};

//######################### SET DEFAULT ADDRESS ###################################
const setDefaultAddress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const { addressId } = req.body;

    const user = await UserModel.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(id),
        "addresses._id": mongoose.Types.ObjectId(addressId),
      },
      { defaultAddress: addressId },
      { new: true }
    );
    if (!user) {
      return next(createError(404, "Address not found for the given id!"));
    }

    return res.status(200).json({
      message: "success",
      data: { defaultAddress: user.defaultAddress },
    });
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = {
  getAddressesByID,
  addNewAddress,
  deleteUserAddress,
  updateAddress,
  setDefaultAddress,
};
