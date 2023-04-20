const { validationResult } = require("express-validator");
const createError = require("http-errors");
const auditModel = require("../../models/auditModel");
const deliveryPartnerModel = require("../../models/deliveryPartnerModel");
const orderModel = require("../../models/orderModel");
const vendorModel = require("../../models/vendorModel");

//########################### GET AUDITS ##############################
const getAudits = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { page, limit, resolved } = req.query;
    let { id } = req.user;

    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    let sortObject = { createdAt: -1 };
    let filterObject = { vendorId: id, auditType: "vendor" };
    if (resolved) {
      filterObject.resolved = resolved;
    }
    let audits = await auditModel
      .find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    let auditsCount = await auditModel.find(filterObject).countDocuments();
    return res
      .status(200)
      .json({ status: true, data: { auditsCount, audits } });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

module.exports = { getAudits };
