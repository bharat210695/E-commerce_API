const createError = require("http-errors");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const orderModel = require("../../models/orderModel");
const reviewModel = require("../../models/reviewModel");
const productModel = require("../../models/productModel");
//########################### GET ALL PRODUCTS ##############################
const getAllProducts = async (req, res, next) => {
  try {
    let { page, limit, sortField, sortValue, status, type, vendorId } =
      req.query;
    let filterObject = {};
    if (status) {
      filterObject.status = status;
    }
    if (type) {
      filterObject.type = type;
    }
    if (vendorId) {
      filterObject.vendorId = vendorId;
    }
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;
    let sortObject = {};
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    const products = await productModel
      .find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);
    const productsCount = await productModel
      .find(filterObject)
      .countDocuments();
    return res.status(200).json({
      data: { count: productsCount, products: products },
      status: true,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### GET PRODUCTS BY ID ##############################
const getProductById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { productId } = req.params;

    const product = await productModel.findById(
      mongoose.Types.ObjectId(productId)
    );
    if (!product) {
      return next(createError(406, "No Product Found!"));
    }

    let completedOrderCount = await orderModel
      .find({
        productId: productId,
        status: "delivered",
      })
      .countDocuments();
    let pendingOrderCount = await orderModel
      .find({
        productId: productId,
        status: {
          $nin: ["delivered", "return-request", "cancelled"],
        },
      })
      .countDocuments();

    return res.status(200).json({
      data: { product, completedOrderCount, pendingOrderCount },
      status: true,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### GET PRODUCTS REVIEWS ##############################
const getProductReviews = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    let { page, limit, productId } = req.query;

    const product = await productModel.findOne({ _id: productId });
    if (!product) {
      return next(createError(406, "No Product Found!"));
    }

    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;
    console.log("productId", productId);
    let reviews = await reviewModel
      .find({ productId: productId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    let reviewCount = await reviewModel
      .find({ productId: productId })
      .countDocuments();
    return res.status(200).json({
      data: { reviews, reviewCount },
      status: true,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### UPDATE PRODUCT STATUS ##############################
const updateProductStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { status, productId } = req.query;

    const product = await productModel.updateOne(
      { _id: mongoose.Types.ObjectId(productId) },
      { status: status.toLowerCase() }
    );

    if (product.modifiedCount !== 1) {
      return next(createError(500, "Some Error Occured!"));
    }

    return res
      .status(200)
      .json({ message: `Product Status updated to ${status}`, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### DELETE PRODUCT ##############################
const deleteProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { productId } = req.params;

    const productExistsInCart = await cartModel.find({ productId: productId });

    if (productExistsInCart) {
      return next(
        createError(401, "Product Already Used in Cart Cannot be deleted!")
      );
    }

    await productModel.deleteOne({ _id: productId });

    return res.status(200).json({ message: `Product Deleted!`, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};
module.exports = {
  getAllProducts,
  getProductById,
  updateProductStatus,
  getProductReviews,
  deleteProduct,
};
