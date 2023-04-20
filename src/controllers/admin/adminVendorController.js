const createError = require("http-errors");
const AdminModel = require("../../models/adminModel");
const VendorModel = require("../../models/vendorModel");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const vendorModel = require("../../models/vendorModel");
const { deleteCity } = require("./adminExternalDataController");
const productModel = require("../../models/productModel");
const orderModel = require("../../models/orderModel");
const reviewModel = require("../../models/reviewModel");

//########################### GET ALL VENDORS ##############################
const getAllVendors = async (req, res, next) => {
  try {
    const { id } = req.user;
    let { page, limit, sortField, sortValue, status, city } = req.query;

    //create filter object
    let filterObject = { vendorId: id };

    //if status exists, add status filter
    if (status) {
      filterObject.status = status;
    }

    //if city exists, add city filter
    if (city) {
      filterObject.city = city;
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
    const vendors = await vendorModel
      .find(filterObject, { password: 0 })
      .sort(sortObject)
      .skip(skip)
      .limit(limit);
    const vendorsCount = await vendorModel.find(filterObject).countDocuments();

    return res
      .status(200)
      .json({ data: { vendors, vendorsCount }, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### GET VENDOR BY ID ##############################
const getVendorById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { vendorId } = req.params;

    const vendor = await VendorModel.findById(
      mongoose.Types.ObjectId(vendorId),
      { password: 0 }
    );

    const completedOrdersCount = await orderModel
      .find({ vendorId: vendorId, status: "delivered" })
      .countDocuments();

    const latestOrders = await orderModel
      .find({ vendorId: vendorId })
      .sort({ created: -1 })
      .limit(5);

    const totalProductsCount = await productModel
      .find({ vendorId: vendorId })
      .countDocuments();
    return res.status(200).json({
      data: {
        vendor: vendor,
        completedOrdersCount,
        totalProductsCount,
        latestOrders,
      },
      status: true,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### UPDATE VENDOR STATUS ##############################
const updateVendorStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { status, vendorId, reason } = req.body;
    let vendor = null;
    let updateObject = {};

    // Status can only be updated to approved if current status
    // is disabled or pending or rejected
    if (status === "approved") {
      vendor = await vendorModel.findOne({
        _id: mongoose.Types.ObjectId(vendorId),
        status: { $in: ["disabled", "pending", "rejected"] },
      });
    }

    //status can only be updated to rejected if
    //current status is pending
    else if (status === "rejected") {
      vendor = await vendorModel.findOne({
        _id: mongoose.Types.ObjectId(vendorId),
        status: "pending",
      });
    }

    //status can only be updated to disabled
    //if current status is approved
    else if (status === "disabled") {
      vendor = await vendorModel.findOne({
        _id: mongoose.Types.ObjectId(vendorId),
        status: "approved",
      });
    }

    if (!vendor) {
      return next(createError(406, "Cannot Perform this Action!"));
    }

    updateObject.status = status;

    if (status === "rejected") {
      updateObject.reasonForRejection = reason;
    }

    const vendorUpdate = await VendorModel.updateOne(
      { _id: mongoose.Types.ObjectId(vendorId) },
      updateObject
    );

    if (vendorUpdate.modifiedCount !== 1) {
      return next(createError(500, "Some Error Occured!"));
    }

    return res
      .status(200)
      .json({ message: `Vendor Status Updated to ${status}`, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### DELETE VENDOR ##############################
const deleteVendor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { vendorId } = req.params;
    let vendorHasProducts = await productModel.findOne({
      vendorId: vendorId,
    });

    //Delete won't be allowed if vendor has listed products
    if (vendorHasProducts) {
      return next(
        createError(406, "Can't Delete When Vendor has Listed Products!")
      );
    }
    let deleteAction = await vendorModel.deleteOne({ _id: vendorId });
    if (deleteAction.deletedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }
    return res.status(200).json({ message: "Vendor Deleted!", status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// ############################## GET VENDOR REVIEWS ##############################
const getVendorReviews = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { page, limit, vendorId } = req.query;

    const vendor = await vendorModel.findOne({
      _id: mongoose.Types.ObjectId(vendorId),
    });
    if (!vendor) {
      return next(createError(404, "Vendor Not Found!"));
    }

    //pagination code
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    //fetch reviews
    const reviews = await reviewModel
      .find({ vendorId: vendorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    let reviewsCount = 0;

    //fetch reviews count
    if (reviews.length > 0) {
      reviewsCount = await productModel
        .find({ vendorId: vendorId })
        .countDocuments();
    }

    return res.status(200).json({
      status: true,
      data: { reviewsCount, reviews },
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  updateVendorStatus,
  deleteVendor,
  getVendorReviews,
};
