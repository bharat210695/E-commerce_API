const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");
const JWT_TOKEN_SECRET = process.env.jwt_secret;

// Check if admin role is primary
const primaryAdminCheck = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token || req.headers["x-api-key"];

    if (!token) {
      throw new Error("A token is required for authentication");
    }
    const decoded = jwt.verify(token, JWT_TOKEN_SECRET);
    let { email } = decoded;
    let isPrimaryAdmin = await adminModel.findOne({
      email: email,
      role: "primary",
    });
    if (!isPrimaryAdmin) {
      throw new Error("Permission Denied!");
    }
    req.user = decoded;
  } catch (e) {
    return res.status(401).json({ status: false, message: e.message });
  }
  return next();
};

// Check if admin role is either primary or secondary
const primaryOrSecondaryAdminCheck = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token || req.headers["x-api-key"];

    if (!token) {
      throw new Error("A token is required for authentication");
    }
    const decoded = jwt.verify(token, JWT_TOKEN_SECRET);

    let { email, id } = decoded;
    let isPrimaryOrSecondaryAdmin = await adminModel.findOne({
      email: email,
      role: { $in: ["primary", "secondary"] },
    });
    if (!isPrimaryOrSecondaryAdmin) {
      throw new Error("Permission Denied!");
    }
    req.user = decoded;
  } catch (e) {
    return res.status(401).json({ status: false, message: e.message });
  }
  return next();
};
const adminCheck = async (req, res, next) => {
  try {
    const token =
      req.body.token || req.query.token || req.headers["x-api-key"];

    if (!token) {
      throw new Error("A token is required for authentication");
    }
    const decoded = jwt.verify(token, JWT_TOKEN_SECRET);
    let { email } = decoded;
    let isPrimaryAdmin = await adminModel.findOne({
      email: email,
    });
    if (!isPrimaryAdmin) {
      throw new Error("Permission Denied!");
    }
    req.user = decoded;
  } catch (e) {
    return res.status(401).json({ status: false, message: e.message });
  }
  return next();
};

module.exports = {
  primaryAdminCheck,
  primaryOrSecondaryAdminCheck,
  adminCheck,
};
