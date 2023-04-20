const { validationResult } = require("express-validator");
const createError = require("http-errors");
const categoryModel = require("../../models/categoryModel");
const vendorModel = require("../../models/vendorModel");

const getCategories = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    let categories =await  categoryModel.find({});
    return res.status(201).json({ status: true, data: categories });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = { getCategories };
