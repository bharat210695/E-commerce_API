const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const DeliveryPartnerModel = require("../../models/deliveryPartnerModel");
const LoginHistoryModel = require("../../models/loginHistoryModel");
const SessionModel = require("../../utility/sessionFunctions");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken");

const JWT_TOKEN_SECRET = process.env.jwt_secret;

const {
  generateSessionObject,
  checkSessionExists,
} = require("../../utility/sessionFunctions");
const deliveryPartnerModel = require("../../models/deliveryPartnerModel");

//############################# DELIVERY PARTNER LOGIN ##############################
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { phone, password } = req.body;

    const deliveryPartner = await DeliveryPartnerModel.findOne({
      phone: phone,
    });

    if (!deliveryPartner) {
      return next(createError(401, "invalid phone number or password"));
    }

    //if Vendor disabled
    if (deliveryPartner.disabled) {
      return next(
        createError(
          401,
          "Account Disabled! Contact Wem Admin to Enable Account!"
        )
      );
    }
    const isValidPassword = bcrypt.compareSync(
      password.toString(),
      deliveryPartner.password
    );

    //If Wrong Password and Last Login Attempt
    if (!isValidPassword && deliveryPartner.loginAttemptsLeft === 1) {
      await deliveryPartnerModel.updateOne(
        { phone: phone },
        {
          $inc: {
            loginAttemptsLeft: -1,
          },
          $set: {
            disabled: true,
          },
        }
      );
      return next(
        createError(
          406,
          "Invalid Credentials. Account Disabled. Contact Wem Admin to Enable Account!"
        )
      );

      //If Wrong Password and not the last login attempt
    } else if (!isValidPassword && deliveryPartner.loginAttemptsLeft > 1) {
      await deliveryPartnerModel.updateOne(
        { phone: phone },
        {
          $inc: {
            loginAttemptsLeft: -1,
          },
        }
      );
      return next(
        createError(
          406,
          `Invalid Credentials! Attempts Remaining : ${
            deliveryPartner.loginAttemptsLeft - 1
          }`
        )
      );
    }

    const iat = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      { phone: phone, id: deliveryPartner._id, exp: iat + 2630000 },
      JWT_TOKEN_SECRET
    );
    await LoginHistoryModel.create({
      phone: deliveryPartner.phone,
      uid: deliveryPartner._id,
      ipAddress: req.ip,
      status: true,
      userType: "courier",
    });

    // Reset Login Attempts to 3
    await deliveryPartnerModel.updateOne(
      { phone: phone },
      {
        $set: {
          loginAttemptsLeft: 3,
        },
      }
    );

    const response = {
      phone: deliveryPartner.phone,
      _id: deliveryPartner._id,
      createdAt: deliveryPartner.createdAt,
      updatedAt: deliveryPartner.updatedAt,
    };
    return res.status(200).json({
      status: true,
      message: "login successful",
      data: response,
      token: token,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## GET DELIVERY PARTNER DETAILS ##############################
const getDeliveryPartner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { email } = req.user;
    console.log(email);
    const isEmailExist = await DeliveryPartnerModel.findOne({ email: email });
    if (!isEmailExist) {
      return res
        .status(400)
        .json({ status: false, message: "authentication failed!" });
    }
    return res
      .status(200)
      .json({ status: true, message: "success", data: isEmailExist });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  // deliveryPartnerRegister,
  login,
  // emailVerificationSendOTP,
  getDeliveryPartner,
};
