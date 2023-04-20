const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const VendorModel = require("../../models/vendorModel");
const LoginHistoryModel = require("../../models/loginHistoryModel");
const sessionModel = require("../../models/sessionModel");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const salt = bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken");
const ip = require("ip");
const {
  generateSessionObject,
  checkSessionExists,
} = require("../../utility/sessionFunctions");
const { sendOtpMail } = require("../../utility/nodeMailerFunction");
const {
  checkVendorExists,
  checkUserExists,
} = require("../../utility/checkExistence");
const vendorModel = require("../../models/vendorModel");
const { ObjectId } = require("mongodb");
const JWT_TOKEN_SECRET = process.env.jwt_secret;

//######################### New Vendor Registration  ###################################
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { name, phone, password } = req.body;

    const isPhoneAlreadyExist = await VendorModel.findOne({
      phone: phone,
    });

    if (isPhoneAlreadyExist) {
      return next(createError(406, "Phone number is already exists!"));
    }

    const id = ObjectId();

    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password
    const vendor = {
      name: name,
      phone: phone,
      password: encryptedPassword,
      _id: id,
    };
    const newVendor = await VendorModel.create(vendor);
    const iat = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      { phone: phone, id: newVendor._id, exp: iat + 2630000 },
      JWT_TOKEN_SECRET
    );
    const vendorObj = {
      name: newVendor.name,
      phone: newVendor.phone,
      createdAt: newVendor.createdAt,
      _id: newVendor._id,
      token: token,
    };
    return res.status(201).json({
      status: true,
      message: "Success",
      data: vendorObj,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  Vendor LOGIN  ###################################
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { phone, password } = req.body;

    const vendor = await VendorModel.findOne({ phone: phone });

    if (!vendor) {
      return next(createError(401, "Vendor Does not Exist!"));
    }

    //if Vendor disabled
    if (vendor.disabled) {
      return next(
        createError(
          401,
          "Account Disabled! Contact Wem Admin to Enable Account!"
        )
      );
    }
    const isValidPassword = bcrypt.compareSync(
      password.toString(),
      vendor.password
    );

    //If Wrong Password and Last Login Attempt
    if (!isValidPassword && vendor.loginAttemptsLeft === 1) {
      await vendorModel.updateOne(
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
    } else if (!isValidPassword && vendor.loginAttemptsLeft > 1) {
      await vendorModel.updateOne(
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
            vendor.loginAttemptsLeft - 1
          }`
        )
      );
    }
    const iat = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      { phone: phone, id: vendor._id, exp: iat + 2630000 },
      JWT_TOKEN_SECRET
    );

    // Add Login History
    await LoginHistoryModel.create({
      phone: vendor.phone,
      uid: vendor._id,
      ipAddress: ip.address(),
      status: true,
      userType: "vendor",
    });

    // Reset Login Attempts to 3
    await vendorModel.updateOne(
      { phone: phone },
      {
        $set: {
          loginAttemptsLeft: 3,
        },
      }
    );
    const response = {
      phone: vendor.phone,
      _id: vendor._id,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
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

//#########################  Vendor SEND OPT TO EMAIL  ###################################
const emailVerificationSendOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { email } = req.body;
    email = email.toLowerCase();

    // send otp in email id for user verification
    const { newSession, sessionToken, otp } = generateSessionObject(email);
    const encryptedOtp = await bcrypt.hash(otp.toString(), salt);
    let doesSessionExists = await checkSessionExists(email);
    const sendMailResponse = await sendOtpMail(email, otp);
    if (sendMailResponse) {
      if (!doesSessionExists) {
        await sessionModel.create(newSession);
      } else {
        await sessionModel.replaceOne({ email: email }, newSession);
      }
      return res.status(200).json({
        status: true,
        message: "OTP has been Sent",
        otp: encryptedOtp,
        sessionToken: sessionToken,
      });
    }

    return next(createError(400, "Some Error Occured"));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
//#########################  Vendor VALIDATE OTP  ###################################
const emailValidateOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return res.status(400).json({ message: errorMessage });
    }

    let { otp, sessionToken, email } = req.body;
    let { id } = req.user;
    const doesUserExists = await VendorModel.findById(
      mongoose.Types.ObjectId(id)
    );

    if (!doesUserExists) {
      return next(createError(401, "Authentication failed!"));
    }

    const isSuccess = await sessionModel.findOne({
      email: email.toLowerCase(),
      otp: otp,
      sessionToken: sessionToken,
    });

    if (!isSuccess) {
      return next(createError(410, "Invalid OTP or session token expired"));
    }

    const user = await VendorModel.updateOne(
      { _id: id },
      {
        $set: {
          isEmailValidated: true,
          email: email,
        },
      }
    );

    if (user.modifiedCount === 1) {
      return res
        .status(200)
        .json({ status: true, message: "Email Verification Successfull" });
    }

    return next(createError(400, "Email verification failed"));
  } catch (err) {
    return next(createError(500, err.message));
  }
};
//#########################  VENDOR RESET PASSWORD  ###################################
const resetVendorPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(410, errorMessage));
    }
    let { oldPassword, newPassword } = req.body;
    let { id } = req.user;
    const vendor = await checkVendorExists(id, "id");

    if (!vendor) {
      return next(createError(410, "Vendor Does Not Exist!"));
    }
    const passwordMatch = bcrypt.compareSync(oldPassword, vendor.password);
    if (oldPassword === newPassword) {
      return next(
        createError(410, "New Password can't be same as old Password!")
      );
    }
    if (passwordMatch) {
      const encryptedPass = await bcrypt.hash(newPassword.toString(), salt);
      await vendorModel.updateOne(
        { _id: id },
        {
          $set: { password: encryptedPass },
        }
      );
      return res
        .status(200)
        .json({ status: true, message: "Password Reset Successfully" });
    }
    return next(createError(410, "Wrong Password!"));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

//######################### SEND OTP FOR FORGOT PASSWORD  ###################################
const sendOtpForForgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { phone } = req.body;
    let user = await checkVendorExists(phone, "phone");
    if (!user) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    const { newSession, sessionToken } = generateSessionObject(phone);
    let doesSessionExists = await checkSessionExists(phone);
    if (!doesSessionExists) {
      await sessionModel.create(newSession);
    } else {
      await sessionModel.replaceOne({ phone: phone }, newSession);
    }

    return res.status(200).json({
      message: `Session Started!`,
      sessionToken: sessionToken,
    });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### CHANGE PASSWORD AFTER FORGOT PASSWORD  ###################################
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { sessionToken, phone, password } = req.body;
    let user = await checkVendorExists(phone, "phone");
    if (!user) {
      return next(createError(406, "Vendor Does Not Exist"));
    }
    //check if session exists
    const sessionExists = await sessionModel.findOne({
      phone: phone,
      sessionToken: sessionToken,
    });
    if (!sessionExists) {
      return next(createError(404, "Session Does Not Exist!"));
    }
    //encrypt password
    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password

    await vendorModel.findOneAndUpdate(
      { phone: phone },
      { password: encryptedPassword }
    );
    return res.status(200).json({ message: "Password has been reset!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

module.exports = {
  register,
  login,
  emailVerificationSendOTP,
  emailValidateOTP,
  resetVendorPassword,
  sendOtpForForgotPassword,
  changePassword,
};
