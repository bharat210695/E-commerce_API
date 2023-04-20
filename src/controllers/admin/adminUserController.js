const createError = require("http-errors");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const userModel = require("../../models/userModel");
const contactUsModel = require("../../models/contactUsModel");

//########################### GET ALL USERS ##############################
const getAllUsers = async (req, res, next) => {
  try {
    let { page, limit, sortField, sortValue, disabled } = req.query;

    //create filter object
    let filterObject = {};

    //if disabled exists, add disabled filter
    if (disabled) {
      filterObject.disabled = disabled;
    }

    //pagination code
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    //create sort object
    let sortObject = {};
    //if sort field and sort value exists, insert in sort object
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    const users = await userModel
      .find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);
    const count = await userModel.find(filterObject).countDocuments();
    return res.status(200).json({ data: users, status: true, count });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### GET USER BY EMAIL ##############################
const getUserByEmail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { email } = req.params;

    const user = await userModel.findOne(
      { email: email },
      {
        password: 0,
      }
    );
    if (!user) {
      return next(createError(404, "No User Found!"));
    }
    return res.status(200).json({ data: user, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### GET USER BY PHONE ##############################
const getUserByPhone = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { phone } = req.params;

    const user = await userModel.findOne(
      { phone: phone },
      {
        password: 0,
      }
    );
    if (!user) {
      return next(createError(404, "No User Found!"));
    }
    return res.status(200).json({ data: user, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### UNBLOCK USER  ##############################
const unblockUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { userId } = req.params;
    const updateResponse = await userModel.updateOne(
      {
        _id: userId,
      },
      {
        disabled: false,
        loginAttemptsLeft: 3,
      }
    );

    if (updateResponse.modifiedCount == 1) {
      return res.status(200).json({ message: "User Unblocked!", status: true });
    }
    return next(createError(500, "Failed to Update!"));
    // } else {
    //   return next(createError(500, "Permission denied!"));
    // }
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### BLOCK USER  ##############################
const blockUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { userId } = req.params;
    const updateResponse = await userModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(userId),
      },
      {
        disabled: true,
        loginAttemptsLeft: 0,
      }
    );

    if (updateResponse.modifiedCount == 1) {
      return res.status(200).json({ message: "User Blocked", status: true });
    }
    return next(createError(500, "Failed to Update!"));
    // } else {
    //   return next(createError(500, "Permission denied!"));
    // }
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### GET USER MESSAGES  ##############################
const getUserMessages = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { resolved } = req.query;
    let filterObject = {};
    if (resolved) {
      filterObject.resolved = resolved;
    }
    let messages = await contactUsModel.find(filterObject);

    if (!messages) {
      return next(createError(406, "No Messages Recieved!"));
    }
    return res.json({ status: true, data: messages });
  } catch (e) {
    return next(createError(406, e.message));
  }
};

//########################### RESOLVE USER MESSAGES  ##############################
const resolveUserMessages = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { messageId } = req.params;

    let resolveMessage = await contactUsModel.updateOne(
      { _id: messageId },
      {
        $set: {
          resolved: true,
        },
      }
    );

    if (resolveMessage.modifiedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }
    return res.json({ status: true, message: "Message Resolved!" });
  } catch (e) {
    return next(createError(406, e.message));
  }
};

module.exports = {
  getAllUsers,
  getUserByEmail,
  getUserByPhone,
  unblockUser,
  blockUser,
  getUserMessages,
  resolveUserMessages,
};
