const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const vendorModel = require("../../models/vendorModel");
const notificationModel = require("../../models/notificationModel");
const ObjectId = mongoose.Types.ObjectId;

//################################### Create Notification #################################
const createNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const { title, description } = req.body;
    const vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    if (vendor.status !== "approved") {
      return next(createError(406, "Permission Denied!"));
    }
    let activeNotification = await notificationModel.count({ vendorId: id });
    console.log("activenotification", activeNotification);
    if (activeNotification >= 2) {
      return next(
        createError(
          406,
          "You can have only Two Active Notifications at a time!"
        )
      );
    }
    let subscribersArray = vendor.subscribers.map((subscriber) => {
      return { uid: subscriber, seen: false };
    });

    await notificationModel.create({
      vendorId: vendor._id,
      title: title,
      description: description,
      type: "promo",
      subscribers: subscribersArray,
    });
    return res.status(201).json({ status: true, message: "success" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//################################### Get Notification #################################
const getNotifications = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    let notificationData = await notificationModel.find({
      vendorId: vendor._id,
    });

    return res.status(201).json({ status: true, data: notificationData });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//################################### Delete Notification #################################
const deleteNotification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    let { notificationId } = req.params;
    const vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    await notificationModel.findOneAndDelete({ _id: notificationId });
    return res
      .status(201)
      .json({ status: true, message: "Notification Deleted!" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  createNotification,
  getNotifications,
  deleteNotification,
};
