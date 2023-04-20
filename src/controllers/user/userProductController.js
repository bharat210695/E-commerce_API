const ProductModel = require("../../models/productModel");
const createError = require("http-errors");
const { default: mongoose } = require("mongoose");
const VendorModel = require("../../models/vendorModel");
const { validationResult } = require("express-validator");
const productModel = require("../../models/productModel");
const reviewModel = require("../../models/reviewModel");

// ############################## GET ALL PRODUCTS WITH PAGINATION ##############################
const getProducts = async (req, res, next) => {
  try {
    let { page, limit, sortField, sortValue, type, gender, rating } = req.query;

    //create filter object
    let filterObject = { status: "active" };

    //if type exists, add type filter
    if (type && type !== "all") {
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

    //for next js ssg
    if (page === "all") {
      const products = await productModel.find({}, { _id: 1 });
      console.log("products", products);
      return res.status(200).json({ status: true, data: products });
    }
    if (!page)
      //pagination code
      page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    //create sort object
    let sortObject = {};
    //if sort field and sort value exists, insert in sort object
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    const products = await productModel
      .find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);
    let productsCount = 0;
    if (products.length > 0) {
      productsCount = await productModel.find(filterObject).countDocuments();
    } else {
      return next(createError(501, "Products Not Found!"));
    }
    return res
      .status(200)
      .json({ status: true, count: productsCount, data: products });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## GET SPONSORED PRODUCTS ##############################
const getSponsoredProducts = async (req, res, next) => {
  try {
    let { gender, type } = req.query;

    //create filter object
    let filterObject = { status: "active", sponsored: true };

    //if type exists, add type filter
    if (type) {
      filterObject.type = type;
    }

    //if gender exists, add gender filter
    if (gender) {
      filterObject.gender = gender;
    }

    const products = await productModel
      .find(filterObject)
      .sort({ createdAt: -1 });

    return res.status(200).json({ status: true, data: products });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## GET  PRODUCT BY ID ##############################
const getProductsByID = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findById(
      mongoose.Types.ObjectId(productId)
    ).lean();
    if (!product) {
      return next(createError(404, "Product not found!"));
    }
    if (product.status !== "active") {
      return next(createError(404, "The product is currently not available!"));
    }
    console.log("product.vendorId", product.vendorId);
    const vendor = await VendorModel.findById(
      mongoose.Types.ObjectId(product.vendorId),
      { _id: 0, storeName: 1 }
    );
    console.log("cp3");
    return res.status(200).json({
      status: true,
      data: { ...product, vendorName: vendor.storeName },
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################## GET  PRODUCT BY ID ##############################
const searchProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { title, page, limit } = req.query;
    if (!page) page = 1;
    if (!limit) limit = 8;
    const skip = (page - 1) * 10;
    const result = await productModel
      .find(
        {
          title: { $regex: title, $options: "i" },
          status: "active",
        },
        { title: 1, defaultImage: 1 }
      )
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ status: true, data: result });
  } catch (e) {
    return res.json({ status: false, message: e.message });
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

// ############################## GET PRODUCTS BY VENDOR WITH PAGINATION ##############################
const getProductsByVendorId = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { vendorId, limit, page, sortField, sortValue, gender, type, rating } =
      req.query;

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
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    //create sort object
    let sortObject = {};
    //if sort field and sort value exists, insert in sort object
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    const count = await ProductModel.find(filterObject).countDocuments();

    const products = await ProductModel.find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ data: { count, products }, status: true });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getProducts,
  getSponsoredProducts,
  getProductsByID,
  getProductsByVendorId,
  searchProducts,
  getProductReviews,
};
