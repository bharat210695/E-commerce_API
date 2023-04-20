const { validationResult } = require("express-validator");
const createError = require("http-errors");
const deliveryPartnerModel = require("../../models/deliveryPartnerModel");
const externalDataModel = require("../../models/externalDataModel");
const ExternalDataModel = require("../../models/externalDataModel");
const vendorModel = require("../../models/vendorModel");

//######################### ADD SPONSOR DATA  ###################################
const addSponsorData = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { totalSlots, pricePerDayForEachSlot } = req.body;

    let externalDataExists = await ExternalDataModel.findOne({
      title: "sponsor_data",
    });
    if (externalDataExists) {
      await externalDataModel.updateOne(
        { title: "sponsor_data" },
        {
          $set: {
            data: [{ totalSlots, pricePerDayForEachSlot }],
          },
        }
      );
      return res
        .status(200)
        .json({ status: true, message: "Sponsor Data Updated!" });
    }
    await ExternalDataModel.create({
      title: "sponsor_data",
      data: [{ totalSlots, pricePerDayForEachSlot }],
    });
    return res
      .status(200)
      .json({ status: true, message: "Sponsor Data Added!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### GET SPONSOR DATA  ###################################
const getSponsorData = async (req, res, next) => {
  try {
    let sponsorData = await ExternalDataModel.findOne({
      title: "sponsor_data",
    });
    if (!sponsorData) {
      return next(createError(401, "No Sponsor Data Found!"));
    }
    return res.status(200).json({ status: true, data: sponsorData.data });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//######################### GET CITIES  ###################################
const getCities = async (req, res, next) => {
  try {
    const response = await ExternalDataModel.findOne(
      {
        title: "available_cities",
      },
      { data: 1, _id: 0 }
    );
    if (response) {
      return res.status(200).json({ data: response.data, status: true });
    }
    return next(createError(404, "No Cities Found!"));
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### DELETE CITIES  ###################################
const deleteCity = async (req, res, next) => {
  try {
    const { city } = req.params;

    //If an approved vendor has this city, can't delete
    let isCityUsedInVendors = await vendorModel.findOne({
      city: city,
      status: "approved",
    });
    //If an active delivery agent has this city, can't delete
    let isCityUsedInDeliveryAgents = await deliveryPartnerModel.findOne({
      cities: { $in: [city] },
      disabled: false,
    });

    if (isCityUsedInVendors || isCityUsedInDeliveryAgents) {
      return next(createError(501, "Not Allowed! City Already in Use!"));
    }
    const response = await ExternalDataModel.updateOne(
      {
        title: "available_cities",
      },
      { $pull: { data: { city: city } } },
      { new: true }
    );
    if (response.modifiedCount === 0) {
      return next(createError(401, "Some Error Occured!"));
    }
    return res.status(200).json({ message: "City Deleted!", status: true });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### ADD CITIES  ###################################
const addCities = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { city } = req.body;
    const response = await ExternalDataModel.updateOne(
      {
        title: "available_cities",
      },

      { $addToSet: { data: { city: city } } },
      { upsert: true }
    );
    if (response.modifiedCount === 0 && response.upsertedCount === 0) {
      return next(createError(401, "Some Error Occured!"));
    }
    return res.status(200).json({ message: "City Added!", status: true });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  addSponsorData,
  getSponsorData,
  getCities,
  deleteCity,
  addCities,
};
