const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const AdminModel = require("../../models/adminModel");
const LoginHistoryModel = require("../../models/loginHistoryModel");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken");
const ip = require("ip");
const orderModel = require("../../models/orderModel");
const adminModel = require("../../models/adminModel");
const vendorModel = require("../../models/vendorModel");

const JWT_TOKEN_SECRET = process.env.jwt_secret;
const ROLE = ["primary", "secondary", "read-only"];

//######################### CREATE NEW ADMIN  ###################################
const createAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { name, email, password, role } = req.body;

    const admin = await AdminModel.findOne({
      email: email.toLowerCase(),
    });

    if (admin) {
      return next(createError(406, "Email already exists!"));
    }

    const encryptedPassword = bcrypt.hashSync(password?.toString(), salt); // encrypted password

    const newAdmin = await AdminModel.create({
      name: name,
      email: email,
      password: encryptedPassword,
      role: role,
    });

    const adminObj = {
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      createdAt: newAdmin.createdAt,
      _id: newAdmin._id,
    };
    return res.status(201).json({
      status: true,
      message: "Success",
      data: adminObj,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

//#########################  ADMIN LOGIN  ###################################
const adminLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { email, password } = req.body;

    const user = await AdminModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return next(createError(401, "invalid email or password"));
    }
    const isValidPassword = bcrypt.compareSync(
      password.toString(),
      user.password
    );

    if (isValidPassword) {
      const iat = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        { email: email, id: user._id, exp: iat + 2630000 },
        JWT_TOKEN_SECRET
      );
      await LoginHistoryModel.create({
        email: user.email,
        uid: user._id,
        ipAddress: ip.address(),
        status: true,
        userType: "admin",
      });

      const response = {
        email: user.email,
        _id: user._id,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      return res.status(200).json({
        status: true,
        message: "login successful",
        data: response,
        token: token,
      });
    } else {
      return next(createError(401, "invalid email or password"));
    }
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  GET ALL ADMINS  ###################################
const getAdmins = async (req, res) => {
  try {
    const { email } = req.user;
    const findAdmin = await AdminModel.findOne({ email: email.toLowerCase() });
    if (!findAdmin) {
      return next(createError(401, "Authentication Failed!"));
    }

    const admins = await AdminModel.find({}, { password: 0 });
    if (!admins || admins.length === 0) {
      return next(createError(404, "No Admins Found!"));
    }

    return res.status(200).json({ data: admins, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//#########################  DELETE A PARTICULAR ADMIN  ###################################
const deleteAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    // const { email } = req.user;
    const { adminId } = req.params;
    // const findAdmin = await AdminModel.findOne({ email: email.toLowerCase() });
    // if (!findAdmin) {
    //   return next(createError(401, "Authentication Failed!"));
    // }
    // if (!ROLE.includes(findAdmin.role) || findAdmin.role === ROLE[2]) {
    //   return next(createError(403, "permission denied!"));
    // }
    const deleteAdmin = await AdminModel.findByIdAndDelete(
      mongoose.Types.ObjectId(adminId)
    );
    if (deleteAdmin === null) {
      return next(createError(404, "User not found!"));
    }
    return res.status(200).json({ message: "success", status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};
//#########################  GET ADMIN DASHBOARD  ###################################
const getAdminDashboard = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { id } = req.user;

    let admin = await adminModel.findOne({ _id: id });

    let onGoingOrders = await orderModel.find({
      status: {
        $nin: ["cancelled", "delivered", "return-request"],
      },
    });

    let onGoingReturnsCount = await orderModel
      .find({
        status: "return-request",
        returnStatus: {
          $nin: ["rejected", "returned"],
        },
      })
      .countDocuments();
    let pendingVendorRequestsCount = await vendorModel
      .find({
        $nin: {
          status: ["approved", "rejected", "disabled"],
        },
      })
      .countDocuments();

    let data = {
      onGoingOrdersCount: onGoingOrders.length,
      onGoingReturnsCount,
      pendingVendorRequestsCount,
      onGoingOrders: onGoingOrders.slice(0, 5),
    };

    return res.status(200).json({ data: data, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};
//#########################  CHECK AUTH  ###################################
const checkAuth = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { id } = req.user;

    let admin = await adminModel.findOne({ _id: id }, { password: 0 });

    return res.status(200).json({ data: admin, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

module.exports = {
  createAdmin,
  adminLogin,
  getAdmins,
  deleteAdmin,
  checkAuth,
  getAdminDashboard,
};
