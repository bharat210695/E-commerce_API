const { validationResult } = require("express-validator");
const createError = require("http-errors");
const orderModel = require("../../models/orderModel");
const reviewModel = require("../../models/reviewModel");
const vendorModel = require("../../models/vendorModel");

//######################### GET REVIEWS ###################################
const getReviews = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { id } = req.user;
    let { page, limit } = req.query;
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    let reviews = await reviewModel
      .find({ vendorId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    let reviewsCount = await reviewModel
      .find({ vendorId: id })
      .countDocuments();
    return res.status(200).json({
      status: true,
      data: { reviews, reviewsCount },
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = { getReviews };
