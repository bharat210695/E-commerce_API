const { validationResult } = require("express-validator");
const createError = require("http-errors");
const deliveryPartnerModel = require("../../models/deliveryPartnerModel");
const orderModel = require("../../models/orderModel");

// ############################## GET DELIVERY PARTNER DETAILS ##############################
const getDeliveryPartner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const isDeliveryPartnerExist = await deliveryPartnerModel.findOne(
      { _id: id },
      { password: 0 }
    );
    if (!isDeliveryPartnerExist) {
      return res
        .status(400)
        .json({ status: false, message: "Authentication Failed!" });
    }
    return res
      .status(200)
      .json({ status: true, message: "success", data: isDeliveryPartnerExist });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ############################## GET DELIVERY PARTNER DASHBOARD DATA ##############################
const getDeliveryPartnerDashboard = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const isDeliveryPartnerExist = await deliveryPartnerModel.findOne(
      { _id: id },
      { password: 0 }
    );
    if (!isDeliveryPartnerExist) {
      return next(createError(406, "Delivery Partner Does not Exist!"));
    }

    let deliveryOrders = await orderModel.find({
      deliveryPartnerId: id,
      status: {
        $in: [
          "pending",
          "packed",
          "dispatched",
          "out-for-delivery",
          "delivered",
        ],
      },
    });
    let pendingOrders = 0;
    let packedOrders = 0;
    let dispatchedOrders = 0;
    let outForDeliveryOrders = 0;
    let deliveredOrders = 0;
    deliveryOrders.map((order) => {
      if (order.status === "pending") {
        pendingOrders++;
      }
      if (order.status === "packed") {
        packedOrders++;
      }
      if (order.status === "dispatched") {
        dispatchedOrders++;
      }
      if (order.status === "out-for-delivery") {
        outForDeliveryOrders++;
      }
      if (order.status === "delivered") {
        deliveredOrders++;
      }
    });

    let returnOrders = await orderModel.find({
      returnStatus: {
        $in: ["processing", "out-for-pickup", "picked", "returned"],
      },
    });
    let processingOrders = 0;
    let pickedOrders = 0;
    let outForPickupOrders = 0;
    let returnedOrders = 0;
    returnOrders.map((order) => {
      if (order.returnStatus === "processing") {
        processingOrders++;
      }
      if (order.returnStatus === "out-for-pickup") {
        outForPickupOrders++;
      }
      if (order.returnStatus === "picked") {
        pickedOrders++;
      }
      if (order.returnStatus === "returned") {
        returnedOrders++;
      }
    });

    let totalDeliveryOrders =
      pendingOrders +
      packedOrders +
      dispatchedOrders +
      outForDeliveryOrders +
      deliveredOrders;
    let totalReturnOrders =
      processingOrders + outForPickupOrders + pickedOrders + returnedOrders;
    return res.json({
      status: true,
      data: {
        email: isDeliveryPartnerExist.email,
        name: isDeliveryPartnerExist.name,
        totalDeliveryOrders: totalDeliveryOrders,

        totalReturnOrders: totalReturnOrders,
        deliveryOrderData: {
          pendingOrders,
          packedOrders,
          dispatchedOrders,
          outForDeliveryOrders,
          deliveredOrders,
        },
        returnOrderData: {
          processingOrders,
          outForPickupOrders,
          pickedOrders,
          returnedOrders,
        },
      },
      message: "success",
    });
  } catch (err) {
    return next(createError(406, err.message));
  }
};

module.exports = { getDeliveryPartner, getDeliveryPartnerDashboard };
