const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const ReviewModel = require("../../models/reviewModel");
const UserModel = require("../../models/userModel");
const ProductModel = require("../../models/productModel");
const VendorModel = require("../../models/vendorModel");

const ObjectId = mongoose.Schema.Types.ObjectId;

//################################## ADD PRODUCT REVIEWS ##########################################
const addProductReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { userId, productId, orderId, vendorId, rating, review } = req.body;

    const isUserExist = await UserModel.findById({ _id: userId });
    if (!isUserExist) {
      return next(createError(406, "User not exist!"));
    }
    const isProductExist = await ProductModel.findById({ _id: productId });

    if (!isProductExist) {
      return next(createError(406, "Product not exist!"));
    }
    const isVendorExist = await VendorModel.findById({ _id: vendorId });

    if (!isVendorExist) {
      return next(createError(406, "Vendor not exist!"));
    }
    const addReview = {
      userId: userId,
      productId: productId,
      orderId: orderId,
      vendorId: vendorId,
      rating: rating,
      review: review,
    };
    const newReview = await ReviewModel.create(addReview);

    ProductModel.bulkWrite([
      {
        updateOne: {
          filter: {
            _id: productId,
          },
          update: { $inc: { "ratingData.rating": rating } }, // update rating for product
        },
      },
      {
        updateOne: {
          filter: {
            _id: productId,
          },
          update: { $inc: { "ratingData.count": 1 } }, // update count for product
        },
      },
    ]);
    VendorModel.bulkWrite([
      {
        updateOne: {
          filter: {
            _id: vendorId,
          },
          update: { $inc: { "ratingData.rating": rating } }, // update rating for vendor
        },
      },
      {
        updateOne: {
          filter: {
            _id: vendorId,
          },
          update: { $inc: { "ratingData.count": 1 } }, // update count for vendor
        },
      },
    ]);

    return res
      .status(201)
      .json({ status: true, message: "success", data: newReview });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ########################### GET REVIEWS BY USER ######################################
const getReviewsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const productReview = await ReviewModel.find({ userId: userId });
    return res
      .status(200)
      .json({ status: true, message: "success", data: productReview });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ########################## GET REVIEWS BY VENDOR ######################################
const getReviewsByVendor = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const productReview = await ReviewModel.find({ vendorId: vendorId });

    return res
      .status(200)
      .json({ status: true, message: "success", data: productReview });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ########################### GET REVIEWS BY PRODUCT ID #################################
const getReviewsByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const productReview = await ReviewModel.find({ productId: productId });

    return res
      .status(200)
      .json({ status: true, message: "success", data: productReview });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  addProductReview,
  getReviewsByUser,
  getReviewsByVendor,
  getReviewsByProductId,
};
