const { validationResult } = require("express-validator");
const createError = require("http-errors");
const ip = require("ip");

const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken");
const JWT_TOKEN_SECRET = process.env.jwt_secret;
const { ObjectId } = require("mongodb");
const sessionModel = require("../../models/sessionModel");
const userModel = require("../../models/userModel");
const {
  sendOtpMail,
  sendOtpSms,
  sendForgotPasswordMail,
} = require("../../utility/nodeMailerFunction");
const {
  generateSessionObject,
  checkSessionExists,
} = require("../../utility/sessionFunctions");
const { checkUserExists } = require("../../utility/checkExistence");
const loginHistoryModel = require("../../models/loginHistoryModel");
const { addMultipleCartItems } = require("../../utility/addMultipleCartItems");

//######################### SEND OTP FOR USER REGISTRATION WITH EMAIL  ###################################
const sendEmailOtpVerificationMail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { email } = req.body;
    email = email.toLowerCase();
    // send otp in email id for user verification

    //check if user already exists
    let userExists = await checkUserExists(email, "email");
    console.log("userExists", userExists);
    if (userExists) {
      return next(createError(409, "User Already Exists!"));
    }

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
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### REGISTER USER WITH EMAIL  ###################################
const userRegisterWithEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return res.status(400).json({ message: errorMessage });
    }

    let { otp, sessionToken, email, password, name, cart } = req.body;

    //check if user already exists
    let userExists = await checkUserExists(email, "email");
    if (userExists) {
      return next(createError(409, "User Already Exists!"));
    }

    //check if session exists
    const sessionExists = await checkSessionExists(email, otp, sessionToken);
    if (!sessionExists) {
      return next(createError(404, "Session Does Not Exist!"));
    }
    //encrypt password
    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password
    //create token
    let id = ObjectId();
    const iat = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ id: id, exp: iat + 2630000 }, JWT_TOKEN_SECRET);

    const cartArray = cart ? await addMultipleCartItems(cart) : [];

    let newUser = {
      _id: id,
      email: email,
      password: encryptedPassword,
      name: name,
      lastLogin: new Date(),
      phone: "",
      isEmailValidated: true,
      cart: cartArray,
    };

    await loginHistoryModel.create({
      phone: "",
      uid: id,
      ipAddress: ip.address(),
      status: true,
      userType: "client",
    });
    await userModel.create(newUser);
    await sessionModel.deleteOne({ email: email });
    return res
      .status(200)
      .json({ message: "Registration Successfull!", token: token });
  } catch (err) {
    return next(createError(500, err.message));
  }
};

//######################### REGISTER USER WITH PHONE  ###################################
const userRegisterWithPhone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { name, phone, password, cart } = req.body;

    //check if user already exists
    let userExists = await checkUserExists(phone, "phone");
    if (userExists) {
      return next(createError(409, "User Already Exists!"));
    }

    //encrypt password
    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password
    //create token
    let id = ObjectId();
    const iat = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ id: id, exp: iat + 2630000 }, JWT_TOKEN_SECRET);
    const cartArray = cart ? await addMultipleCartItems(cart) : [];
    let newUser = {
      _id: id,
      email: "",
      password: encryptedPassword,
      name: name,
      lastLogin: new Date(),
      phone: phone,
      isPhoneValidated: true,
      cart: cartArray,
    };

    await loginHistoryModel.create({
      phone: "",
      uid: id,
      ipAddress: ip.address(),
      status: true,
      userType: "client",
    });

    await userModel.create(newUser);
    return res
      .status(200)
      .json({ message: "Registration Successfull!", token: token });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### LOGIN USER WITH EMAIL ###################################
const loginUserWithEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { email, password, cart } = req.body;
    let user = await checkUserExists(email, "email");

    if (!user) {
      return next(createError(409, "User Does Not Exist!"));
    }

    //verify password
    const isValidPassword = await bcrypt.compare(
      password.toString(),
      user.password
    );

    if (!isValidPassword) {
      if (user.loginAttemptsLeft > 0) {
        if (user.loginAttemptsLeft === 1) {
          user.disabled = true;
        }
        user.loginAttemptsLeft = user.loginAttemptsLeft - 1;
        await user.save();
        await loginHistoryModel.create({
          phone: "",
          uid: user._id,
          ipAddress: ip.address(),
          status: false,
          userType: "client",
        });
      }
      return next(
        createError(409, {
          message: {
            msg: "Invalid Credentials!",
            attemptsLeft: user.loginAttemptsLeft,
          },
        })
      );
    }
    //save localstroage cart to user cart db
    if (cart && Array.isArray(cart) && cart.length > 0) {
      const cartArray = await addMultipleCartItems(cart);
      user.cart = cartArray;
      await user.save();
    }
    if (user.loginAttemptsLeft > 0 && user.loginAttemptsLeft < 3) {
      user.loginAttemptsLeft = 3;
      await user.save();
    }
    user.lastLogin = new Date();
    await user.save();
    //create token
    let id = user._id;
    const iat = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ id: id, exp: iat + 2630000 }, JWT_TOKEN_SECRET);
    await loginHistoryModel.create({
      phone: "",
      uid: id,
      ipAddress: ip.address(),
      status: true,
      userType: "client",
    });
    return res
      .status(200)
      .json({ message: "Login Successfull!", token: token });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### LOGIN USER WITH PHONE  ###################################
const loginUserWithPhone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { phone, password, cart } = req.body;
    let user = await checkUserExists(phone, "phone");
    if (!user) {
      return next(createError(404, "User Does Not Exist!"));
    }
    if (user.disabled) {
      return next(
        createError(
          410,
          "Your account has been temporary blocked! Contact admin to unblock your account."
        )
      );
    }
    //verify password
    const isValidPassword = await bcrypt.compare(
      password.toString(),
      user.password
    );

    if (!isValidPassword) {
      if (user.loginAttemptsLeft > 0) {
        if (user.loginAttemptsLeft === 1) {
          user.disabled = true;
        }
        user.loginAttemptsLeft = user.loginAttemptsLeft - 1;
        await user.save();
        await loginHistoryModel.create({
          phone: "",
          uid: user._id,
          ipAddress: ip.address(),
          status: false,
          userType: "client",
        });
      }
      return next(
        createError(409, {
          message: {
            msg: "Invalid Credentials!",
            attemptsLeft: user.loginAttemptsLeft,
          },
        })
      );
    }

    //create token
    let id = user._id;
    const iat = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ id: id, exp: iat + 2630000 }, JWT_TOKEN_SECRET);

    //save localstroage cart to user cart db
    if (cart && Array.isArray(cart) && cart.length > 0) {
      const cartArray = await addMultipleCartItems(cart);
      user.cart = cartArray;
      await user.save();
    }
    if (user.loginAttemptsLeft > 0 && user.loginAttemptsLeft < 3) {
      user.loginAttemptsLeft = 3;
      await user.save();
    }
    user.lastLogin = new Date();
    await user.save();

    await loginHistoryModel.create({
      phone: "",
      uid: id,
      ipAddress: ip.address(),
      status: true,
      userType: "client",
    });
    return res
      .status(200)
      .json({ message: "Login Successfull!", token: token });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### SEND EMAIL OTP FOR VALIDATION  ###################################
const sendEmailOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { id } = req.user;
    let { email } = req.body;
    let user = await checkUserExists(id, "id");
    if (!user) {
      return next(createError(406, "User Does Not Exist!"));
    }

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
    }

    return res.status(200).json({
      message: `OTP has been sent to ${email}!`,
      otp: encryptedOtp,
      sessionToken: sessionToken,
    });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### VALIDATE EMAIL  ###################################
const validateEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    console.log("req.body", req.body);
    let { otp, sessionToken, email } = req.body;
    let { id } = req.user;
    let user = await checkUserExists(id, "id");
    if (!user) {
      return next(createError(404, "User Does Not Exist"));
    }
    console.log("checkpoint 2");

    //check if session exists
    const sessionExists = await checkSessionExists(email, otp, sessionToken);

    if (!sessionExists) {
      return next(createError(404, "Invalid OTP or session expired!"));
    }
    console.log("checkpoint 3");

    await userModel.findOneAndUpdate(
      { _id: id },
      { email: email, isEmailValidated: true }
    );
    return res.status(200).json({ message: "Email Validation Successful!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### ADD PHONE NUMBER  ###################################
const addPhoneNumber = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { phone } = req.body;
    let { id } = req.user;
    //check if phone number already exists
    let isPhoneAlreadyExists = await checkUserExists(phone, "phone");
    if (isPhoneAlreadyExists) {
      return next(
        createError(409, "Phone Number is already linked to another Account!")
      );
    }
    let addPhone = await userModel.updateOne(
      { _id: id },
      {
        $set: {
          phone: phone,
          isPhoneValidated: true,
        },
      }
    );
    if (addPhone.modifiedCount === 0) {
      return next(createError(409, "Some Error Occured!"));
    }
    return res.status(200).json({
      message: "Phone Number has been added!",
      status: true,
    });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### SEND OTP IN EMAIL FOR FORGOT PASSWORD  ###################################
const sendOtpForForgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { email } = req.body;
    let user = await checkUserExists(email, "email");
    if (!user) {
      return next(createError(406, "User Does Not Exist!"));
    }
    const { newSession, sessionToken, otp } = generateSessionObject(email);
    const encryptedOtp = await bcrypt.hash(otp.toString(), salt);
    let doesSessionExists = await checkSessionExists(email);
    const sendMailResponse = await sendForgotPasswordMail(email, otp);
    if (sendMailResponse) {
      if (!doesSessionExists) {
        await sessionModel.create(newSession);
      } else {
        await sessionModel.replaceOne({ email: email }, newSession);
      }
    }

    return res.status(200).json({
      message: `OTP has been sent to ${email}!`,
      otp: encryptedOtp,
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
    let { otp, sessionToken, email, password } = req.body;
    let user = await checkUserExists(email, "email");
    if (!user) {
      return next(createError(406, "User Does Not Exist"));
    }
    //check if session exists
    const sessionExists = await checkSessionExists(email, otp, sessionToken);
    if (!sessionExists) {
      return next(createError(404, "Session Does Not Exist!"));
    }
    //encrypt password
    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password

    await userModel.findOneAndUpdate(
      { email: email },
      { password: encryptedPassword }
    );
    return res.status(200).json({ message: "Password has been reset!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### CHANGE PASSWORD WITH PHONE NUMBER  ###################################
const changePasswordWithPhone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { phone, password } = req.body;
    let user = await checkUserExists(phone, "phone");
    if (!user) {
      return next(createError(406, "User Does Not Exist"));
    }

    //encrypt password
    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password

    let updatePhone = await userModel.updateOne(
      { phone: phone },
      { $set: { password: encryptedPassword } }
    );
    if (updatePhone.modifiedCount === 0) {
      return next(createError(500, "Some Error Occured!"));
    }
    return res
      .status(200)
      .json({ status: true, message: "Password has been reset!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### RESET USER PASSWORD  ###################################
const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(410, errorMessage));
    }
    let { oldPassword, newPassword } = req.body;
    let { id } = req.user;
    const vendor = await checkUserExists(id, "id");

    if (!vendor) {
      return next(createError(404, "User not found!"));
    }
    if (oldPassword === newPassword) {
      return next(
        createError(406, "New Password can't be same as old Password!")
      );
    }
    const passwordMatch = bcrypt.compareSync(oldPassword, vendor.password);
    if (passwordMatch) {
      const encryptedPass = await bcrypt.hash(newPassword.toString(), salt);
      await userModel.updateOne(
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

module.exports = {
  userRegisterWithEmail,
  sendEmailOtpVerificationMail,
  userRegisterWithPhone,
  loginUserWithEmail,
  loginUserWithPhone,
  sendEmailOtp,
  validateEmail,
  addPhoneNumber,
  sendOtpForForgotPassword,
  changePassword,
  changePasswordWithPhone,
  resetPassword,
};
