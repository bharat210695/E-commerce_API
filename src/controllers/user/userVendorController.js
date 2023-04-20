const { validationResult } = require("express-validator");
const createError = require("http-errors");
const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const productModel = require("../../models/productModel");
const reviewModel = require("../../models/reviewModel");
const userModel = require("../../models/userModel");
const vendorModel = require("../../models/vendorModel");

// ############################## GET VENDOR DETAILS BY ID ##############################
const getVendorProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { page, limit, sortField, sortValue, type, gender, rating, vendorId } =
      req.query;
    const vendor = await vendorModel.findOne({
      _id: vendorId,
      status: "approved",
    });
    if (!vendor) {
      return next(createError(404, "Vendor Not Found!"));
    }

    //create filter object
    let filterObject = { status: "active", vendorId: vendorId };

    //if type exists, add type filter
    if (type) {
      filterObject.type = type;
    }

    //if gender exists, add gender filter
    if (gender) {
      filterObject.gender = gender;
    }
    //if rating exists, add rating filter
    if (rating) {
      let queryObject = { $gte: Number(rating) };
      filterObject.rating = { $gte: Number(rating) };
    }

    //pagination code
    console.log("limit", limit);
    console.log("page", page);
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;
    console.log("skip", skip);

    //create sort object
    let sortObject = { createdAt: -1 };
    //if sort field and sort value exists, insert in sort object
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    console.log("filterObject", filterObject);
    console.log("sortObject", sortObject);
    console.log("skip", skip);
    console.log("limit", limit);
    const products = await productModel
      .find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);
    console.log("products", products);
    let productsCount = 0;
    if (products.length > 0) {
      productsCount = await productModel.find(filterObject).countDocuments();
    }
    console.log("productsCount", productsCount);
    return res.status(200).json({
      status: true,
      data: { count: productsCount, products: products, vendor: vendor },
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## GET VENDOR REVIEWS ##############################
const getVendorReviews = async (req, res, next) => {
  try {
    console.log("here");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { page, limit, vendorId } = req.query;

    const vendor = await vendorModel.findOne({
      _id: mongoose.Types.ObjectId(vendorId),
      status: "approved",
    });
    console.log("vendor", vendor);
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

// ############################## GET VENDORS ##############################
const getVendors = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { page, limit, city, sortField, sortValue, rating } = req.query;

    //pagination code
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    let filterObject = { status: "approved" };

    if (city) {
      filterObject.city = city;
    }

    if (rating) {
      let queryObject = { $gte: Number(rating) };
      filterObject.rating = { $gte: Number(rating) };
    }

    //for next js ssg compatibility
    if (page === "all") {
      const vendors = await vendorModel.find(filterObject);

      let vendorsCount = await vendorModel.find(filterObject).countDocuments();
      return res.status(200).json({
        status: true,
        data: { count: vendorsCount, vendors: vendors },
      });
    }

    //create sort object
    let sortObject = {};
    //if sort field and sort value exists, insert in sort object
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    const vendors = await vendorModel
      .find(filterObject)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const vendorsCount = await vendorModel
      .find(filterObject)
      .sort({ createdAt: -1 })
      .countDocuments();
    return res
      .status(200)
      .json({ status: true, data: { count: vendorsCount, vendors: vendors } });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = { getVendors, getVendorProducts, getVendorReviews };
