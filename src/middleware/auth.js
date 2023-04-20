const createError = require("http-errors");
const jwt = require("jsonwebtoken");

const JWT_TOKEN_SECRET = process.env.jwt_secret;

// authentication..................................
const auth = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers["x-api-key"];

  if (!token) {
    return next(createError(500, "Token Required!"));
  }
  try {
    const decoded = jwt.verify(token, JWT_TOKEN_SECRET);
    req.user = decoded;
  } catch (err) {
    return next(createError(500, "Invalid Token!"));
  }
  next();
};

module.exports = { auth };
