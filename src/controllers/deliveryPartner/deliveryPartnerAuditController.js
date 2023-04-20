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
    let { resolved } = req.query;
    let { id } = req.user;

    let sortObject = { createdAt: -1 };
    let filterObject = { deliveryPartnerId: id, auditType: "delivery-partner" };
    if (resolved) {
      filterObject.resolved = resolved;
    }
    let audits = await auditModel.find(filterObject).sort(sortObject);
    if (audits.length === 0) {
      return next(createError(500, "No Audits Found!"));
    }
    return res
      .status(200)
      .json({ status: true, data: audits, message: "success" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

module.exports = { getAudits };
