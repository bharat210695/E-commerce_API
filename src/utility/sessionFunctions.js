const { v4: uuidv4 } = require("uuid");
const SessionModel = require("../models/sessionModel");
const { generateOTP } = require("./generateOTP");

exports.generateSessionObject = (email) => {
  const otp = generateOTP();
  let sessionToken = uuidv4();
  const newSession = {
    createdAt: new Date(),
    email: email,
    sessionToken: sessionToken,
    otp: otp,
  };
  return { newSession, sessionToken, otp };
};

exports.checkSessionExists = async (email, otp, sessionToken) => {
  try {
    const session = await SessionModel.findOne({
      email: email,
      otp: otp,
      sessionToken: sessionToken,
    });
    return session;
  } catch (error) {
    return error.message;
  }
};
