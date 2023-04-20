const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const ProductModel = require("../../models/productModel");
const ExternalDataModel = require("../../models/externalDataModel");
const vendorModel = require("../../models/vendorModel");
const productModel = require("../../models/productModel");
const ObjectId = mongoose.Types.ObjectId;

//################################### ADD PRODUCT #################################
const addProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;

    let { gst, discount, attributes } = req.body;

    let discountPrice = 0;

    //Add Discount Price to Original Price and then add gst if it's greater than 0
    attributes = attributes.map((attribute) => {
      console.log("attribute", attribute);
      let newSizes = attribute.sizes.map((size) => {
        if (size.value === true && size.price > 0) {
          let tempPrice = Number(size.price) + Number(discount);
          if (Number(gst) > 0) {
            tempPrice = tempPrice + (size.price / 100) * Number(gst);
          }
          defaultPrice = tempPrice;
          return { ...size, price: tempPrice };
        }
        return { ...size };
      });
      return { ...attribute, sizes: newSizes };
    });

    let productObject = { ...req.body, attributes };

    const newProduct = await ProductModel.create({
      ...productObject,
      defaultPrice: defaultPrice,
      vendorId: id,
    });

    return res
      .status(201)
      .json({ status: true, message: "success", data: newProduct });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ################################## UPDATE PRODUCTS #######################################
const updateProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const {
      productId, //productId
      title,
      description,
      type,
      defaultPrice,
      discount,
      gender,
      defaultImage,
      brandName,
      allowReturn,
      categoryId,
      subCategoryId,
    } = req.body;

    const isProductIdExist = await ProductModel.findById(ObjectId(productId));
    if (!isProductIdExist) {
      return next(createError(406, "Product not exist!"));
    }
    const { id: vendorId } = req.user;
    await ProductModel.findOneAndUpdate(
      { _id: ObjectId(productId) },
      {
        $set: {
          title: title,
          description: description,
          brandName: brandName,
          categoryId: categoryId,
          subCategoryId: subCategoryId,
          defaultPrice: defaultPrice,
          discount: discount,
          gender: gender,
          defaultImage: defaultImage,
          type: type,
          allowReturn: allowReturn,
        },
      }
    );
    return res.status(201).json({ status: true, message: "Success!" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ################################# UPDATE PRODUCT IMAGE ####################################
const updateProductImage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { productId, attributeId, color, colorCode, images } = req.body;
    console.log("req.body", req.body);
    productId = ObjectId(productId);
    attributeId = ObjectId(attributeId);

    await ProductModel.updateMany(
      { _id: productId, "attributes._id": attributeId },
      {
        $set: {
          "attributes.$.color": color,
          "attributes.$.colorCode": colorCode,
          "attributes.$.images": images,
        },
      }
    );

    return res.status(200).json({ status: true, message: "Success" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ################################### UPDATE PRODUCT SIZE #############################
const updateProductSize = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { productId, attributeId, sizes } = req.body;

    productId = ObjectId(productId);
    attributeId = ObjectId(attributeId);

    await ProductModel.updateMany(
      { _id: productId, "attributes._id": attributeId },
      { $set: { "attributes.$.sizes": sizes } }
    );

    return res.status(200).json({ status: true, message: "success" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ################################### ADD NEW COLOR #############################
const addNewColor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { images, color, productId, colorCode, sizes } = req.body;

    let newColorObject = {
      _id: new ObjectId(),
      colorCode,
      color,
      images,
      sizes,
    };

    let addColor = await ProductModel.updateOne(
      { _id: productId },
      {
        $push: { attributes: newColorObject },
      }
    );

    if (addColor.modifiedCount === 0) {
      return next(createError(501, "Some Error Occured!"));
    }
    return res
      .status(200)
      .json({ status: true, message: "Color Added Successfully!" });
  } catch (e) {
    return res.status(500).json({ status: false, message: e.message });
  }
};

// ##################################### DELETE PRODUCT ######################################
const deleteProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.params;
    const isProductIdExist = await ProductModel.findById({ _id: id });
    if (!isProductIdExist) {
      return next(createError(406, "Product not exist!"));
    }
    await ProductModel.deleteOne({ _id: id });
    return res
      .status(200)
      .json({ status: true, message: "Delete Successfully!" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################### GET PRODUCT BY ITS ID ###############################
const getProductById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    const { productId } = req.params;

    const findProduct = await ProductModel.findOne({
      _id: productId,
      vendorId: id,
    });

    return res.status(200).json({
      status: true,
      message: "success",
      data: findProduct,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ################################## GET ALL VENDOR PRODUCTS ################################
const getAllVendorProducts = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { id } = req.user;
    let { page, limit, sortField, sortValue, status, type } = req.query;
    let filterObject = { vendorId: id };
    if (status) {
      filterObject.status = status;
    }
    if (type) {
      filterObject.type = type;
    }
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;
    let sortObject = {};
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    } else {
      sortObject["createdAt"] = -1;
    }
    const products = await ProductModel.find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .populate("cateogry");
    const productsCount = await ProductModel.find(
      filterObject
    ).countDocuments();

    return res.status(200).json({
      status: true,

      data: { products, productsCount },
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//########################### UPDATE PRODUCT STATUS ##############################
const updateProductStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { id } = req.user;
    const doesVendorExits = await vendorModel.findById(
      mongoose.Types.ObjectId(id)
    );
    if (!doesVendorExits) {
      return next(createError(404, "User Not Found!"));
    }

    //check admin has pemission to update
    const { status, productId } = req.body;

    const product = await ProductModel.updateOne(
      { _id: mongoose.Types.ObjectId(productId), vendorId: id },
      { status: status.toLowerCase() }
    );

    if (product.modifiedCount === 0) {
      return next(createError(500, "Some Error Ocured!"));
    }

    return res
      .status(200)
      .json({ message: `Product Status Updated to ${status}`, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### SEARCH PRODUCT ##############################
const searchProducts = async (req, res, next) => {
  try {
    console.log("here");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { title, page, limit } = req.query;
    let { id } = req.user;
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * 10;
    const result = await productModel
      .find({
        title: { $regex: title, $options: "i" },
        vendorId: id,
      })
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ status: true, data: result });
  } catch (e) {
    return res.json({ status: false, message: e.message });
  }
};

module.exports = {
  addProduct,
  updateProducts,
  updateProductImage,
  updateProductSize,
  deleteProduct,
  getProductById,
  getAllVendorProducts,
  updateProductStatus,
  searchProducts,
  addNewColor,
};
