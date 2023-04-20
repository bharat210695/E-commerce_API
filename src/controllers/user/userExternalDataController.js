const createError = require("http-errors");
const externalDataModel = require("../../models/externalDataModel");

const getActiveCities = async (req, res, next) => {
  try {
    const cities = await externalDataModel.findOne({
      title: "available_cities",
    });
    return res.status(200).json({ status: true, data: cities.data });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

module.exports = { getActiveCities };
