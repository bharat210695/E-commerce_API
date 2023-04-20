const { validationResult } = require("express-validator");
const createError = require("http-errors");
const orderModel = require("../../models/orderModel");
const vendorModel = require("../../models/vendorModel");
const { generateOTP } = require("../../utility/generateOTP");

//######################### GET ORDERS ###################################
const getOrders = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { id } = req.user;
    let {
      page,
      limit,
      sortField,
      sortValue,
      status,
      deliveryType,
      paymentMode,
    } = req.query;
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;
    let sortObject = {};
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }
    let filterObject = {};
    if (status) {
      filterObject.status = status;
    }
    if (deliveryType) {
      filterObject.deliveryType = deliveryType;
    }
    if (paymentMode) {
      filterObject.paymentMode = paymentMode;
    }

    let orders = await orderModel
      .find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    let ordersCount = await orderModel.find(filterObject).countDocuments();

    return res.status(200).json({
      status: true,
      data: { ordersCount, orders },
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### GET SINGLE ORDER DETAILS ###################################
const getOrderDetail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;

    let { orderId } = req.params;

    let orders = await orderModel.findOne({ _id: orderId });

    return res.status(200).json({
      status: true,
      data: orders,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### CANCEL ORDER ###################################
const cancelOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { orderId, cancelledBy } = req.body;
    let updateOrder = await orderModel.updateOne(
      { _id: orderId },
      {
        $set: {
          status: "cancelled",
          cancelledBy: cancelledBy,
        },
      }
    );

    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }

    return res.status(200).json({
      status: true,
      message: "Order Cancelled!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### CANCEL ORDER ###################################
const completeCourierOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { orderId } = req.body;
    let updateOrder = await orderModel.updateOne(
      { _id: orderId },
      {
        $set: {
          status: "delivered",
        },
      }
    );

    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }

    return res.status(200).json({
      status: true,
      message: "Order Delivered!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### SEARCH ORDER ###################################
const searchOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { orderId } = req.params;

    let orders = await orderModel.find({
      $or: [{ orderId: orderId }, { _id: orderId }],
    });

    return res.status(200).json({
      status: true,
      data: orders,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### RESOLVE RETURN REQUEST ###################################
const resolveReturnRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { orderId, returnStatus } = req.body;

    let updateOrder = null;
    if (returnStatus === "processing") {
      updateOrder = await orderModel.updateOne(
        {
          _id: orderId,
          status: "return-request",
          returnStatus: "pending",
        },
        {
          $set: {
            returnRefundStatus: "pending",
            returnStatus: returnStatus,
            customerOtp: generateOTP(),
            deliveryPartnerOtp: generateOTP(),
          },
        }
      );
    } else if (returnStatus === "rejected") {
      updateOrder = await orderModel.updateOne(
        {
          _id: orderId,
          status: "return-request",
          returnStatus: "pending",
        },
        {
          $set: {
            returnStatus: returnStatus,
          },
        }
      );
    }
    if (updateOrder.modifiedCount === 0) {
      return next(createError(501, "Some Error Occured!"));
    }

    return res.status(200).json({
      status: true,
      message: `Order Return ${
        returnStatus === "processing" ? "Processing" : "Cancelled"
      }!`,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### UPDATE RETURN REFUND STATUS ###################################
const updateReturnRefundStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { orderId } = req.params;
    let updateOrder = await orderModel.updateOne(
      {
        _id: orderId,
        status: "return-request",
        returnRefundStatus: "pending",
        returnStatus: {
          $in: ["picked", "returned"],
        },
      },
      {
        $set: {
          returnRefundStatus: "paid",
        },
      }
    );

    if (updateOrder.modifiedCount === 0) {
      return next(createError(501, "Some Error Occured!"));
    }

    return res.status(200).json({
      status: true,
      message: `Status Updated!`,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getOrders,
  getOrderDetail,
  cancelOrder,
  searchOrder,
  resolveReturnRequest,
  updateReturnRefundStatus,
  completeCourierOrder,
};
