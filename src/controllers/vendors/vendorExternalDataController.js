const createError = require("http-errors");
const externalDataModel = require("../../models/externalDataModel");
const vendorModel = require("../../models/vendorModel");

const getActiveCities = async (req, res, next) => {
  try {
    const { id } = req.user;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(400, "Vendor Does Not Exist"));
    }
    const cities = await externalDataModel.findOne({
      title: "available_cities",
    });
    return res.status(200).json({ status: true, data: cities.data });
  } catch (e) {
    return next(createError(500, e.message));
  }
};
const getSponsorData = async (req, res, next) => {
  try {
    const { id } = req.user;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(400, "Vendor Does Not Exist"));
    }
    const cities = await externalDataModel.findOne({
      title: "sponsor_data",
    });
    return res.status(200).json({ status: true, data: cities.data });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

module.exports = { getActiveCities, getSponsorData };
