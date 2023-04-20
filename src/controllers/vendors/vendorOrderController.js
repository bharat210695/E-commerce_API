const { validationResult } = require("express-validator");
const createError = require("http-errors");
const orderModel = require("../../models/orderModel");
const vendorModel = require("../../models/vendorModel");

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
    let filterObject = { vendorId: id };
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
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    let { orderId } = req.params;

    let orders = await orderModel.findOne(
      { _id: orderId },

      { deliveryPartnerOtp: 0, customerOtp: 0 }
    );

    return res.status(200).json({
      status: true,
      data: orders,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//######################### UPDATE ORDER STATUS TO PACKED ###################################
const packOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId } = req.params;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    await orderModel.updateOne(
      { _id: orderId },
      {
        $set: {
          status: "packed",
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Order Status Updated to Packed!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  UPDATE ORDER STATUS TO DISPATCHED ###################################
const dispatchOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId, otp, trackingId } = req.body;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    let order = await orderModel.findOne({ _id: orderId });
    if (!order) {
      return next(createError(406, "Order Does Not Exist!"));
    }
    let updateOrder = null;
    if (order.deliveryType === "courier") {
      updateOrder = await orderModel.updateOne(
        { _id: orderId, status: "packed" },
        {
          $set: {
            status: "dispatched",
            trackingId: trackingId,
          },
        }
      );
    } else {
      updateOrder = await orderModel.updateOne(
        { _id: orderId, deliveryPartnerOtp: otp, status: "packed" },
        {
          $set: {
            status: "dispatched",
          },
        }
      );
    }

    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }
    return res.status(200).json({
      status: true,
      message: "Order Status Updated to Dispatched!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  UPDATE ORDER STATUS TO RETURNED ###################################
const completeReturn = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId, otp } = req.query;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }

    let updateOrder = await orderModel.updateOne(
      {
        _id: orderId,
        deliveryPartnerOtp: otp,
        status: "return-request",
        returnStatus: "picked",
      },
      {
        $set: {
          returnStatus: "returned",
        },
      }
    );

    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "No Order to Update!"));
    }
    return res.status(200).json({
      status: true,
      message: "Order has been returned!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  UPDATE ORDER STATUS TO DELIVERED ###################################
const completeOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId } = req.params;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    let order = await orderModel.findOne({ _id: orderId });
    if (!order) {
      return next(createError(406, "Order Does Not Exist!"));
    }
    if (order.deliveryType !== "courier") {
      return next(createError(406, "Wrong Request!"));
    }

    let updateOrder = await orderModel.updateOne(
      {
        _id: orderId,
        status: "dispatched",
      },
      {
        $set: {
          status: "delivered",
        },
      }
    );

    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "No Order to Update!"));
    }
    return res.status(200).json({
      status: true,
      message: "Order has been returned!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  ADD TRACKING ID ###################################
const addTrackingId = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId, trackingId } = req.body;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }

    let updateOrder = await orderModel.updateOne(
      {
        _id: orderId,
        status: "packed",
        deliveryType: "courier",
      },
      {
        $set: {
          trackingId: trackingId,
          status: "dispatched",
        },
      }
    );

    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "No Order to Update!"));
    }
    return res.status(200).json({
      status: true,
      message: "Order has been returned!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getOrders,
  getOrderDetail,
  packOrder,
  dispatchOrder,
  completeReturn,
  addTrackingId,
  completeOrder,
};
