const { validationResult } = require("express-validator");
const createError = require("http-errors");
const moment = require("moment/moment");
const auditModel = require("../../models/auditModel");
const deliveryPartnerModel = require("../../models/deliveryPartnerModel");
const orderModel = require("../../models/orderModel");
const vendorModel = require("../../models/vendorModel");

//########################### CREATE VENDOR AUDIT ##############################
const createVendorAudit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { vendorId, from, to } = req.body;

    from = moment(from).format();
    to = moment(to).add(1, "d").format();
    //check if vendor exists in database
    let vendor = await vendorModel.findOne({ _id: vendorId });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist"));
    }

    //check if orders exist for given vendor in given time range
    let orders = await orderModel.find({
      createdAt: { $gte: from, $lte: to },
      vendorId: vendorId,
      $or: [
        { status: "delivered" },
        { status: "return-request", returnStatus: "rejected" },
      ],
    });
    console.log("orders", orders);
    if (!orders || orders.length === 0) {
      return next(createError(406, "No Orders in the given Time Range!"));
    }

    let totalCodPrice = 0;
    let totalCodNetAmount = 0;
    let totalCodOrders = 0;
    let totalOnlinePrice = 0;
    let totalOnlineNetAmount = 0;
    let totalOnlineOrders = 0;
    let orderData = [];
    let totalCourierOrders = 0;
    //generate COD and Online Audit Data
    orders.map((order) => {
      let {
        orderId,
        customerName,
        qty,
        createdAt,
        totalPrice,
        netAmount,
        paymentMode,
        deliveryType,
      } = order;
      if (deliveryType === "courier") {
        totalCourierOrders += 1;
      }
      if (paymentMode === "cod") {
        totalCodPrice += totalPrice;
        totalCodNetAmount += netAmount;
        totalCodOrders += 1;
      } else if (paymentMode === "online") {
        totalOnlinePrice += totalPrice;
        totalOnlineNetAmount += netAmount;
        totalOnlineOrders += 1;
      }
      orderData.push({
        orderId,
        customerName,
        date: createdAt,
        items: qty,
        paymentMode,
      });
    });

    let codPaymentVendorShare = (totalCodPrice / 100) * 90;
    let codPaymentWemShare = (totalCodPrice / 100) * 10;
    let onlinePaymentVendorShare =
      (totalOnlinePrice / 100) * 90 +
      totalCourierOrders * Number(vendor.deliveryCharge);
    let onlinePaymentWemShare = (totalOnlinePrice / 100) * 10;

    let auditObject = {
      auditType: "vendor",
      vendorId: vendorId,
      from: from,
      to: to,
      codPaymentTotalOrders: totalCodOrders,
      onlinePaymentTotalOrders: totalOnlineOrders,
      codPaymentTotalPrice: totalCodPrice,
      codPaymentNetAmount: totalCodNetAmount,
      onlinePaymentTotalPrice: totalOnlinePrice,
      onlinePaymentNetAmount: totalOnlineNetAmount,
      codPaymentVendorShare,
      codPaymentWemShare,
      onlinePaymentVendorShare,
      onlinePaymentWemShare,
      orders: orderData,
    };

    let auditCreate = await auditModel.create(auditObject);
    return res.status(200).json({
      status: true,
      message: "Audit Created Successfully!",
      auditCreate,
    });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//########################### CREATE DELIVERY PARTNER AUDIT ##############################
const createDeliveryPartnerAudit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { deliveryPartnerId, from, to } = req.body;
    //check if delivery partner exists in database
    let deliveryPartner = await deliveryPartnerModel.findOne({
      _id: deliveryPartnerId,
    });
    if (!deliveryPartner) {
      return next(createError(406, "Delivery Partner Does Not Exist"));
    }

    //check if orders exist for given delivery partner in given time range
    // let orders = await orderModel.find({
    //   createdAt: { $gte: from, $lte: to },
    //   deliveryPartnerId: deliveryPartnerId,
    //   status: "delivered",
    // });
    let orders = await orderModel.find({
      $or: [
        {
          createdAt: { $gte: from, $lte: to },
          deliveryPartnerId: deliveryPartnerId,
          status: "delivered",
        },
        {
          createdAt: { $gte: from, $lte: to },
          deliveryPartnerId: deliveryPartnerId,
          status: "return-request",
          returnStatus: "returned",
        },
      ],
    });
    if (!orders) {
      return next(createError(406, "No Orders in the given Time Range!"));
    }

    let totalCodPrice = 0;
    let totalCodNetAmount = 0;
    let totalCodOrders = 0;
    let totalOnlinePrice = 0;
    let totalOnlineNetAmount = 0;
    let totalOnlineOrders = 0;
    let totalOnlinePaymentDeliveryFee = 0;
    let totalCodPaymentDeliveryFee = 0;
    let orderData = [];
    //generate COD and Online Audit Data
    orders.map((order) => {
      let {
        orderId,
        customerName,
        qty,
        createdAt,
        price,
        netAmount,
        paymentMode,
        deliveryFee,
        status,
        returnStatus,
      } = order;
      if (paymentMode === "cod") {
        if (status === "return-request" && returnStatus === "returned") {
          totalCodPaymentDeliveryFee += deliveryFee * 2;
        } else if (status === "delivered") {
          totalCodPaymentDeliveryFee += deliveryFee;
        }
        totalCodPrice += price;
        totalCodNetAmount += netAmount;
        totalCodOrders += 1;
      } else if (paymentMode === "online") {
        if (status === "return-request" && returnStatus === "returned") {
          totalOnlinePaymentDeliveryFee += deliveryFee * 2;
        } else if (status === "delivered") {
          totalOnlinePaymentDeliveryFee += deliveryFee;
        }
        totalOnlinePrice += price;
        totalOnlineNetAmount += netAmount;
        totalOnlineOrders += 1;
      }
      orderData.push({
        orderId,
        customerName,
        date: createdAt,
        items: qty,
        paymentMode,
      });
    });

    let auditObject = {
      auditType: "delivery-partner",
      deliveryPartnerId: deliveryPartnerId,
      from: from,
      to: to,
      codPaymentTotalOrders: totalCodOrders,
      onlinePaymentTotalOrders: totalOnlineOrders,
      codPaymentTotalPrice: totalCodPrice,
      codPaymentNetAmount: totalCodNetAmount,
      onlinePaymentTotalPrice: totalOnlinePrice,
      onlinePaymentNetAmount: totalOnlineNetAmount,
      onlinePaymentDeliveryPartnerShare: totalOnlinePaymentDeliveryFee,
      codPaymentDeliveryPartnerShare: totalCodPaymentDeliveryFee,
      orders: orderData,
    };

    await auditModel.create(auditObject);
    return res.status(200).json({ status: true, message: "Audit Created!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//########################### GET AUDITS ##############################
const getAudits = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { page, limit, auditType, id, sortField, sortValue, resolved } =
      req.query;

    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    let sortObject = {};
    let filterObject = {};
    if (auditType) {
      filterObject.auditType = auditType;
    }
    if (resolved) {
      filterObject.resolved = resolved;
    }

    let audits = null;
    let auditsCount = 0;
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    if (auditType === "vendor") {
      filterObject.vendorId = id;
      audits = await auditModel
        .find(filterObject)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      auditsCount = await auditModel.find(filterObject).countDocuments();
    } else if (auditType === "delivery-partner") {
      filterObject.deliveryPartnerId = id;
      audits = await auditModel
        .find(filterObject)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      auditsCount = await auditModel.find(filterObject).countDocuments();
    }
    return res
      .status(200)
      .json({ status: true, data: { auditsCount, audits } });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//########################### DELETE AUDIT ##############################
const deleteAudit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { auditId } = req.params;

    //check if audit exists in database
    let audit = await auditModel.findOne({ _id: auditId });
    if (!audit) {
      return next(createError(406, "Audit Does Not Exist!"));
    }
    if (audit.resolved) {
      return next(createError(406, "Resolved Audit can not be Deleted!"));
    }

    await auditModel.deleteOne({ _id: auditId });

    return res.status(200).json({ status: true, data: "Audit Deleted!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

//########################### RESOLVE AUDIT ##############################
const resolveAudit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let { auditId } = req.params;

    //check if audit exists in database
    let audit = await auditModel.findOne({ _id: auditId });
    if (!audit) {
      return next(createError(406, "Audit Does Not Exist!"));
    }

    await auditModel.updateOne(
      { _id: auditId },
      {
        $set: {
          resolved: true,
        },
      }
    );

    return res.status(200).json({ status: true, data: "Audit Resolved!" });
  } catch (e) {
    return next(createError(500, e.message));
  }
};

module.exports = {
  createVendorAudit,
  getAudits,
  deleteAudit,
  resolveAudit,
  createDeliveryPartnerAudit,
};
