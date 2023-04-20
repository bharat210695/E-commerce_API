const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const createError = require("http-errors");
const SponsoredHistoryModel = require("../../models/sponsoredHistoryModel");
const VendorModel = require("../../models/vendorModel");
const ExternalDataModel = require("../../models/externalDataModel");
const ProductModel = require("../../models/productModel");
const { checkVendorExists } = require("../../utility/checkExistence");
const ObjectId = mongoose.Types.ObjectId;

// ##################################### ADD SPONSOR FOR VENDOR ################################
const addVendorSponsor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { days, products } = req.body;
    const { id } = req.user;
    const vendor = await checkVendorExists(id, "id");

    if (!vendor) {
      return next(createError(404, "Vendor not exist!"));
    }
    const findSponsoredData = await ExternalDataModel.findOne({
      title: "sponsor_data",
    });
    let requiredSlots = products.length;
    let data = findSponsoredData.data;
    let totalSlots = data[0].totalSlots;
    let pricePerDayForEachSlot = data[0].pricePerDayForEachSlot;

    const fetchActiveSlots = await ProductModel.find({
      sponsored: true,
    }).countDocuments();

    const availableSlots = totalSlots - fetchActiveSlots;

    if (requiredSlots <= availableSlots) {
      const generateFee = products.length * pricePerDayForEachSlot * days;

      const sponsor = {
        vendorId: vendor._id,
        vendorName: vendor.name,
        days: days,
        fee: generateFee,
        products: products,
      };
      const addSponsor = await SponsoredHistoryModel.create(sponsor);

      return res.status(201).json({
        status: true,
        message: "Sponsor Request Added!",
        totalActiveSlots: fetchActiveSlots.length,
        ExternalData: findSponsoredData,
        data: addSponsor,
      });
    } else {
      return next(
        createError(409, `Oops! We only have ${availableSlots} slots left!`)
      );
    }
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ######################################### DELETE VENDOR SPONSOR ################################
const deleteVendorSponsor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { sponsorId } = req.params;
    const isSponsorExist = await SponsoredHistoryModel.findById({
      _id: sponsorId,
    });
    if (isSponsorExist) {
      if (isSponsorExist.status === "active") {
        return next(createError(409, "Can't Delete an active Sponsor!"));
      } else {
        await SponsoredHistoryModel.deleteOne({ _id: sponsorId });
        return res
          .status(200)
          .json({ status: true, message: "Sponsor Deleted" });
      }
    }
    return next(createError(409, "Sponsor Not Found!"));
  } catch (error) {
    return next(createError(501, error.message));
  }
};

// ############################### GET VENDOR SPONSOR ################################
const getVendorSponsor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const sponsorData = await SponsoredHistoryModel.find({
      vendorId: id,
    });
    return res
      .status(200)
      .json({ status: true, message: "Success", data: sponsorData });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  addVendorSponsor,
  deleteVendorSponsor,
  getVendorSponsor,
};
