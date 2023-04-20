const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");

const {
  authController,
  deliveryPartnerOrderController,
  deliveryPartnerDataController,
  deliveryPartnerAuditController,
} = require("../controllers/deliveryPartner");

const middleware = require("../middleware/auth");

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- AUTH API -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ###################### DELIVERY PARTNER LOGIN #########################
router.post(
  "/login",
  [
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isMobilePhone("en-IN", { strictMode: true })
      .withMessage("Invalid phone number")
      .trim(),
    body("password")
      .notEmpty()
      .withMessage("password can not be empty")
      .isLength({ min: 8, max: 15 })
      .withMessage("password must be atleast 8 characters long"),
  ],
  authController.login
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- FETCH PARTNER DETAILS API -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//########################### FETCH DELIVERY PARTNER PROFILE ##################################
router.get(
  "/profile",
  middleware.auth,
  deliveryPartnerDataController.getDeliveryPartner
);

//########################### FETCH DELIVERY PARTNER DASHBOARD ##################################
router.get(
  "/dashboard",
  middleware.auth,
  deliveryPartnerDataController.getDeliveryPartnerDashboard
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- ORDERS API -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ########################### GET ORDERS  ############################
router.get(
  "/orders",
  middleware.auth,
  deliveryPartnerOrderController.getOrders
);

// ########################### GET PENDING ORDERS  ############################
router.get(
  "/pending-orders",
  [
    query("status")
      .notEmpty()
      .withMessage("status Required!")
      .isString()
      .withMessage("Invalid status Type!")
      .isIn(["all", "pending", "packed", "dispatched", "out-for-delivery"]),
    query("returnStatus")
      .notEmpty()
      .withMessage("returnStatus Required!")
      .isString()
      .withMessage("Invalid returnStatus Type!")
      .isIn(["all", "processing", "out-for-pickup", "picked"]),
  ],
  middleware.auth,
  deliveryPartnerOrderController.getPendingOrders
);

// ########################### GET ORDER DETAILS ############################
router.get(
  "/order/:orderId",

  middleware.auth,
  deliveryPartnerOrderController.getOrderDetail
);

// ########################### UPDATE ORDER TO OUT FOR DELIVERY STATUS ############################
router.patch(
  "/order/out-for-delivery",
  [
    query("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
  ],
  middleware.auth,
  deliveryPartnerOrderController.setOrderOutForDelivery
);

// ########################### DELIVER ORDER ############################
router.patch(
  "/order/deliver",
  [
    query("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
    query("otp")
      .isString()
      .withMessage("OTP must be a String!")
      .notEmpty()
      .withMessage("OTP Must not be Empty!")
      .isLength({ min: 4, max: 4 })
      .withMessage("Invalid OTP Length!"),
  ],
  middleware.auth,
  deliveryPartnerOrderController.deliverOrder
);

// ########################### UPDATE RETURN STATUS TO OUT FOR PICK UP ############################
router.patch(
  "/return/out-for-pickup",
  [
    query("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
  ],
  middleware.auth,
  deliveryPartnerOrderController.setOrderOutForPickUp
);

// ########################### UPDATE RETURN STATUS TO PICKED ############################
router.patch(
  "/return/picked",
  [
    query("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
    query("otp")
      .isString()
      .withMessage("OTP must be a String!")
      .notEmpty()
      .withMessage("OTP Must not be Empty!")
      .isLength({ min: 4, max: 4 })
      .withMessage("Invalid OTP Length!"),
  ],
  middleware.auth,
  deliveryPartnerOrderController.pickOrder
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- AUDIT -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//########################### GET AUDITS ##################################
router.get(
  "/audits",
  middleware.auth,
  deliveryPartnerAuditController.getAudits
);

module.exports = router;
