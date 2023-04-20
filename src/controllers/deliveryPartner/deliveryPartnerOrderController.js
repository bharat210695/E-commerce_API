const { validationResult } = require("express-validator");
const createError = require("http-errors");
const deliveryPartnerModel = require("../../models/deliveryPartnerModel");
const orderModel = require("../../models/orderModel");
const vendorModel = require("../../models/vendorModel");

//#########################  GET ORDERS ###################################
const getOrders = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let deliveryPartner = await deliveryPartnerModel.findOne({ _id: id });
    if (!deliveryPartner) {
      return next(createError(406, "Delivery Partner Does Not Exist!"));
    }
    let { page, limit, sortField, sortValue, status, returnStatus } = req.query;
    let filterObject = { deliveryPartnerId: id };
    if (status && returnStatus) {
      return next(createError(406, "Only One Parameter Required!"));
    }
    if (status) {
      filterObject.status = status;
    }
    if (returnStatus) {
      filterObject.returnStatus = returnStatus;
    }
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;
    let sortObject = {};
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }

    console.log("filterObject", filterObject);
    console.log("sortObject", sortObject);

    let orders = await orderModel
      .find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);

    if (orders.length === 0) {
      return next(createError(400, "No Orders Found!"));
    }

    return res.status(200).json({
      status: true,
      data: orders,
      message: "success",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  GET PENDING ORDERS ###################################
const getPendingOrders = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let deliveryPartner = await deliveryPartnerModel.findOne({ _id: id });
    if (!deliveryPartner) {
      return next(createError(406, "Delivery Partner Does Not Exist!"));
    }
    let { status, returnStatus } = req.query;

    let orders = null;
    let filterObject = { deliveryPartnerId: id };
    if (status !== "all" || returnStatus !== "all") {
      if (status !== "all") {
        filterObject.status = status;
      }
      if (returnStatus !== "all") {
        filterObject.status = "return-request";
        filterObject.returnStatus = returnStatus;
      }
      orders = await orderModel.find(filterObject).sort({ createdAt: -1 });
    } else {
      orders = await orderModel
        .find(
          {
            deliveryPartnerId: id,
            $or: [
              {
                status: { $nin: ["delivered", "cancelled"] },
              },
              {
                $and: [
                  { status: "return-request" },
                  { returnStatus: { $nin: ["rejected", "returned"] } },
                ],
              },
            ],
          },
          { customerOtp: 0 }
        )
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      status: true,
      data: orders,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  GET ORDER DETAILS ###################################
const getOrderDetail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let deliveryPartner = await deliveryPartnerModel.findOne({ _id: id });
    if (!deliveryPartner) {
      return next(createError(406, "Delivery Partner Does Not Exist!"));
    }
    let { orderId } = req.params;

    let order = await orderModel
      .findOne({ _id: orderId, deliveryPartnerId: id })
      .lean();
    if (!order) {
      return next(createError(406, "Order not Found!"));
    }

    let vendorId = order.vendorId;

    let vendor = await vendorModel.findOne({ _id: vendorId }, { phone: 1 });

    order = { ...order, vendorPhone: vendor.phone };

    return res.status(200).json({
      status: true,
      data: order,
      message: "success",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  UPDATE ORDER STATUS TO OUT-FOR-DELIVERY ###################################
const setOrderOutForDelivery = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId } = req.query;
    let deliverypartner = await deliveryPartnerModel.findOne({ _id: id });
    if (!deliverypartner) {
      return next(createError(406, "Delivery Partner Does Not Exist!"));
    }
    await orderModel.updateOne(
      { _id: orderId, deliveryPartnerId: id },
      {
        $set: {
          status: "out-for-delivery",
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Order Status Updated to Out For Delivery!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  UPDATE ORDER STATUS TO DELIVERED ###################################
const deliverOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId, otp } = req.query;
    let deliveryPartner = await deliveryPartnerModel.findOne({ _id: id });
    if (!deliveryPartner) {
      return next(createError(406, "Delivery Partner Does Not Exist!"));
    }
    let updateOrder = await orderModel.updateOne(
      { _id: orderId, customerOtp: otp, deliveryPartnerId: id },
      {
        $set: {
          status: "delivered",
        },
      }
    );
    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "No Order to Update"));
    }
    await deliveryPartnerModel.updateOne(
      { _id: id },
      {
        $inc: {
          completedDeliveries: 1,
          pendingDeliveries: -1,
        },
      }
    );
    return res.status(200).json({
      status: true,
      message: "Order has been Delivered!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  UPDATE RETURN STATUS TO OUT-FOR-PICKUP ###################################
const setOrderOutForPickUp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId } = req.query;
    let deliverypartner = await deliveryPartnerModel.findOne({ _id: id });
    if (!deliverypartner) {
      return next(createError(406, "Delivery Partner Does Not Exist!"));
    }
    let updateStatus = await orderModel.updateOne(
      { _id: orderId, deliveryPartnerId: id, returnStatus: "processing" },
      {
        $set: {
          returnStatus: "out-for-pickup",
        },
      }
    );
    if (updateStatus.modifiedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }

    return res.status(200).json({
      status: true,
      message: "Order Status Updated to Out For Delivery!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//#########################  PICK ORDER FOR RETURN  ###################################
const pickOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { id } = req.user;
    let { orderId, otp } = req.query;
    let deliveryPartner = await deliveryPartnerModel.findOne({ _id: id });
    if (!deliveryPartner) {
      return next(createError(406, "Delivery Partner Does Not Exist!"));
    }
    let updateOrder = await orderModel.updateOne(
      {
        _id: orderId,
        customerOtp: otp,
        deliveryPartnerId: id,
        returnStatus: "out-for-pickup",
      },
      {
        $set: {
          returnStatus: "picked",
        },
      }
    );
    if (updateOrder.modifiedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }
    await deliveryPartnerModel.updateOne(
      { _id: id },
      {
        $inc: {
          completedDeliveries: 1,
          pendingDeliveries: -1,
        },
      }
    );
    return res.status(200).json({
      status: true,
      message: "Order has been Delivered!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getOrders,
  getPendingOrders,
  getOrderDetail,
  setOrderOutForDelivery,
  deliverOrder,
  setOrderOutForPickUp,
  pickOrder,
};
