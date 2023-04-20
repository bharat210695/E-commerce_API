const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");

const {
  authController,
  vendorProductController,
  vendorNotificationController,
  vendorDataController,

  sponsoredHistoryController,
  vendorExternalDataController,
  vendorOrderController,
  vendorCategoriesController,
  vendorAuditController,
  vendorReviewController,
} = require("../controllers/vendors");

const middleware = require("../middleware/auth");

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$--- VENDOR AUTH API----$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//######################### VENDOR REGISTER ###################################
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Vendor name is required").trim(),
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
  authController.register
);

//#########################  VENDOR LOGIN ####################################
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

//#########################  VENDOR SEND OTP TO EMAIL ########################
router.post(
  "/email-verification/send-otp",
  middleware.auth,
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("invalid email address")
    .trim(),
  authController.emailVerificationSendOTP
);

//#########################  VENDOR VALIDATE OTP #############################
router.patch(
  "/email-verification/validate-otp",
  middleware.auth,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid Email Address!")
      .trim(),
    body("otp")
      .notEmpty()
      .withMessage("OTP is Required!")
      .isLength({ min: 4, max: 4 })
      .withMessage("Provide a 4-Digit OTP!"),
    body("sessionToken").notEmpty().withMessage("Session Token is Required!"),
  ],
  authController.emailValidateOTP
);

// ########################## VENDOR RESET PASSWORD  ########################
router.patch(
  "/password",
  [
    body("oldPassword")
      .notEmpty()
      .withMessage("password can not be empty")
      .isLength({ min: 8, max: 15 })
      .withMessage("password must be atleast 8 characters long"),
    body("newPassword")
      .notEmpty()
      .withMessage("password can not be empty")
      .isLength({ min: 8, max: 15 })
      .withMessage("password must be atleast 8 characters long"),
  ],
  middleware.auth,
  authController.resetVendorPassword
);

//####################### FORGOT PASSWORD START SESSION ###############################
router.post(
  "/forgot-password/start-session",
  [body("phone").trim().isString().withMessage("Invalid Format!")],
  authController.sendOtpForForgotPassword
);

//####################### CHANGE PASSWORD AFTER FORGOT PASSWORD ###############################
router.post(
  "/forgot-password/validate-session",
  [
    body("phone").trim().isString().withMessage("Invalid Format!"),

    body("sessionToken")
      .isString()
      .withMessage("Session Token must be a string!"),
    body("password")
      .isString()
      .withMessage("Password must be a string!")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6 to 15 characters!"),
  ],
  authController.changePassword
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$--- PRODUCT API----$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//######################## ADD PRODUCT #######################################
router.post(
  "/product",
  middleware.auth,
  [
    body("title").notEmpty().withMessage("Product Name Required").trim(),
    body("description")
      .notEmpty()
      .withMessage("Product Description Required")
      .trim(),
    body("brandName")
      .notEmpty()
      .withMessage("Brand Name is Required!")
      .isString()
      .withMessage("Brand Name must be String!")
      .trim(),
    body("categoryId")
      .notEmpty()
      .withMessage("Category ID Required!")
      .isMongoId()
      .withMessage("Invalid Category ID!")
      .trim(),
    body("subCategoryId")
      .notEmpty()
      .withMessage("Sub-Category ID Required!")
      .isMongoId()
      .withMessage("Invalid Sub-Category ID!")
      .trim(),
    body("category")
      .notEmpty()
      .withMessage("Category  Required!")
      .isString()
      .withMessage("Invalid Category!")
      .trim(),
    body("subCategory")
      .notEmpty()
      .withMessage("Sub-Category Required!")
      .isString()
      .withMessage("Invalid Sub-Category!")
      .trim(),
    body("discount")
      .notEmpty()
      .withMessage("Discount is Required!")
      .isInt()
      .withMessage("Discount must be Integer!"),

    body("gender")
      .notEmpty()
      .withMessage("Gender is Required!")
      .isString()
      .withMessage("Default Price must be String!")
      .isIn(["male", "female", "both"])
      .withMessage("Gender must be Male, Female or Both!")
      .trim()
      .toLowerCase(),
    body("attributes")
      .notEmpty()
      .withMessage("Attributes is Required!")
      .isArray()
      .withMessage("Attributes must be Array!"),
    body("defaultImage")
      .notEmpty()
      .withMessage("Default Image is Required!")
      .isString()
      .withMessage("Default Image must be String!")
      .trim(),
    body("type")
      .notEmpty()
      .withMessage("Type is Required!")
      .isString()
      .withMessage("Type must be String!")
      .isIn(["clothing", "accessories"])
      .withMessage("Type must be either Clothing or Accessories!")
      .trim()
      .toLowerCase(),
    body("allowReturn")
      .notEmpty()
      .withMessage("allowReturn is Required!")
      .isBoolean()
      .withMessage("allowReturn must be Boolean!"),
  ],
  vendorProductController.addProduct
);

// ######################## UPDATE PRODUCTS #################################
router.patch(
  "/product/update-basic-details",
  middleware.auth,
  [
    body("productId")
      .notEmpty()
      .withMessage("Product ID Required")
      .isMongoId()
      .withMessage("Invalid Product ID Format!")
      .trim(),
    body("title").notEmpty().withMessage("Product Name Required").trim(),
    body("description")
      .notEmpty()
      .withMessage("Product Description Required")
      .trim(),
    body("brandName")
      .notEmpty()
      .withMessage("Brand Name is Required!")
      .isString()
      .withMessage("Brand Name must be String!")
      .trim(),
    body("categoryId")
      .notEmpty()
      .withMessage("Category ID Required!")
      .isMongoId()
      .withMessage("Invalid Category ID!")
      .trim(),
    body("subCategoryId")
      .notEmpty()
      .withMessage("Sub-Category ID Required!")
      .isMongoId()
      .withMessage("Invalid Sub-Category ID!")
      .trim(),
    body("defaultPrice")
      .notEmpty()
      .withMessage("Default Price is Required!")
      .isInt()
      .withMessage("Default Price must be Integer!")
      .trim(),
    body("discount")
      .notEmpty()
      .withMessage("Discount is Required!")
      .isInt()
      .withMessage("Discount must be Integer!"),
    body("gender")
      .notEmpty()
      .withMessage("Gender is Required!")
      .isString()
      .withMessage("Default Price must be String!")
      .isIn(["male", "female", "others"])
      .withMessage("Gender must be Male, Female or Others!")
      .trim()
      .toLowerCase(),
    body("defaultImage")
      .notEmpty()
      .withMessage("Default Image is Required!")
      .isString()
      .withMessage("Default Image must be String!")
      .trim(),
    body("type")
      .notEmpty()
      .withMessage("Type is Required!")
      .isString()
      .withMessage("Type must be String!")
      .isIn(["clothing", "accessories"])
      .withMessage("Type must be either Clothing or Accessories!")
      .trim()
      .toLowerCase(),
    body("allowReturn")
      .notEmpty()
      .withMessage("allowReturn is Required!")
      .isBoolean()
      .withMessage("allowReturn must be Boolean!"),
  ],
  vendorProductController.updateProducts
);

// ######################## UPDATE PRODUCT IMAGE #############################
router.post(
  "/product/update-image",
  middleware.auth,
  [
    body("productId")
      .notEmpty()
      .withMessage("Product ID Required")
      .isMongoId()
      .withMessage("Invalid Product ID Format!")
      .trim(),
    body("attributeId")
      .notEmpty()
      .withMessage("Attribute ID Required")
      .isMongoId()
      .withMessage("Invalid Attribute ID Format!")
      .trim(),
    body("color")
      .notEmpty()
      .withMessage("Color Required!")
      .isString()
      .withMessage("Color musst be String!")
      .trim(),
    body("colorCode")
      .notEmpty()
      .withMessage("Color Code Required!")
      .isString()
      .withMessage("Color Code must be String!")
      .trim(),
    body("images")
      .notEmpty()
      .withMessage("Images Required!")
      .isArray()
      .withMessage("Images must be Array!"),
  ],
  vendorProductController.updateProductImage
);

// ######################## UPDATE PRODUCT SIZE ###############################
router.patch(
  "/product/update-size",
  middleware.auth,
  [
    body("productId")
      .notEmpty()
      .withMessage("Product ID Required")
      .isMongoId()
      .withMessage("Invalid Product ID Format!")
      .trim(),
    body("attributeId")
      .notEmpty()
      .withMessage("Attribute ID Required")
      .isMongoId()
      .withMessage("Invalid Attribute ID Format!")
      .trim(),
    body("sizes")
      .notEmpty()
      .withMessage("Sizes Required!")
      .isArray()
      .withMessage("Sizes must be Array!"),
  ],
  vendorProductController.updateProductSize
);

// ######################## ADD NEW COLOR ###############################
router.patch(
  "/product/color",
  middleware.auth,
  [
    body("productId")
      .notEmpty()
      .withMessage("Product ID Required")
      .isMongoId()
      .withMessage("Invalid Product ID Format!")
      .trim(),
    body("color")
      .notEmpty()
      .withMessage("Color Required!")
      .isString()
      .withMessage("Color musst be String!")
      .trim(),
    body("colorCode")
      .notEmpty()
      .withMessage("Color Code Required!")
      .isString()
      .withMessage("Color Code must be String!")
      .trim(),
    body("images")
      .notEmpty()
      .withMessage("Images Required!")
      .isArray()
      .withMessage("Images must be Array!"),
    body("sizes")
      .notEmpty()
      .withMessage("Sizes Required!")
      .isArray()
      .withMessage("Sizes must be Array!"),
  ],
  vendorProductController.addNewColor
);

// ########################## DELETE PRODUCT ##################################
router.delete("/delete/product/:id", vendorProductController.deleteProduct);

// ########################## GET PRODUCT BY ITS ID ########################
router.get(
  "/product/:productId",
  middleware.auth,
  vendorProductController.getProductById
);

// ########################## GET ALL PRODUCTS OF VENDOR  ########################
router.get(
  "/product",
  middleware.auth,
  vendorProductController.getAllVendorProducts
);

// ########################## UPDATE PRODUCT STATUS  ########################
router.patch(
  "/product/update-status",
  middleware.auth,
  [
    body("status")
      .notEmpty()
      .withMessage("Status cannot be empty")
      .isIn(["active", "hidden"])
      .withMessage("Status must be either active or hidden"),
    body("productId")
      .notEmpty()
      .withMessage("Product ID cannot be empty")
      .isMongoId()
      .withMessage("Invalid product id"),
  ],
  vendorProductController.updateProductStatus
);

// ########################## SEARCH PRODUCTS WITH TITLE  ########################
router.get(
  "/search-product",
  [
    query("title")
      .notEmpty()
      .withMessage("Title must not be empty!")
      .isString()
      .withMessage("Title must be String!"),
  ],
  middleware.auth,
  vendorProductController.searchProducts
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$--- VENDOR NOTIFICATION API----$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ########################## CREATE NOTIFICATION ########################
router.post(
  "/notification",
  [
    body("title").notEmpty().withMessage("Notification Title Required!").trim(),
    body("description")
      .notEmpty()
      .withMessage("Desciption is Required!")
      .trim(),
  ],
  middleware.auth,
  vendorNotificationController.createNotification
);

// ########################## GET NOTIFICATION ########################
router.get(
  "/notification",
  middleware.auth,
  vendorNotificationController.getNotifications
);

// ########################## DELETE NOTIFICATION ########################
router.delete(
  "/notification/:notificationId",
  [param("notificationId").isMongoId().withMessage("Invalid Id")],
  middleware.auth,
  vendorNotificationController.deleteNotification
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$--- VENDOR DATA API----$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ########################## VENDOR DATA UPDATE  ########################
router.put(
  "",
  [
    body("name")
      .isString()
      .withMessage("Full Name Must be String!")
      .isLength({ min: 3, max: 20 })
      .withMessage("Full Name must be between 3 to 20 characters!"),
    body("storeName")
      .isString()
      .withMessage("Store Name Must be String!")
      .isLength({ min: 3, max: 25 })
      .withMessage("Store Length must be between 3 to 15 characters!"),
    body("address").isObject().withMessage("Address Must be Object!"),
    body("deliveryCharge")
      .isInt()
      .withMessage("Delivery Charge must be String!"),
    body("city").isString().withMessage("City Name Must be String!"),

    body("aadharNumber")
      .isString()
      .withMessage("Aadhar Number Must be String!")
      .isLength({ min: 12, max: 12 })
      .withMessage("Aadhar Number must be of length 12!"),
    body("panNumber")
      .isString()
      .withMessage("PAN Number Must be String!")
      .isLength({ min: 10, max: 10 })
      .withMessage("PAN Number must be of length 10!"),
    body("aadharFrontImage")
      .isString()
      .withMessage("Aadhar Front Image Must be String!"),
    body("aadharFrontFileId")
      .isString()
      .withMessage("Aadhar Front File ID Must be String!"),

    body("aadharBackImage")
      .isString()
      .withMessage("Aadhar Back Image Must be String!"),

    body("aadharBackFileId")
      .isString()
      .withMessage("Aadhar Back File ID Must be String!"),

    body("panImage").isString().withMessage("Pan Image Must Be String!"),

    body("panFileId").isString().withMessage("Pan File ID Must be String!"),

    body("image").isString().withMessage("Image Must be String!"),

    body("imageFileId")
      .isString()
      .withMessage("Image File ID Name Must be String!"),
  ],
  middleware.auth,
  vendorDataController.updateVendorData
);

// ########################## VENDOR UPLOAD IMAGE  ########################
router.put("/image-upload", vendorDataController.uploadImage);

// ########################## VENDOR DELETE IMAGE  ########################
router.delete("/image-delete", vendorDataController.deleteImage);

// ########################## GET  VENDOR DETAILS   ########################
router.get("", middleware.auth, vendorDataController.getVendorData);

// ########################## GET  VENDOR DASHBOARD DATA   ########################
router.get(
  "/dashboard",
  middleware.auth,
  vendorDataController.getVendorDashboardData
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- SPONSOR HISTORY API -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ########################## ADD SPONSOR FOR VENDOR ###########################
router.post(
  "/sponsor",
  middleware.auth,
  sponsoredHistoryController.addVendorSponsor
);

// ########################### DELETE VENDOR SPONSOR ##########################
router.delete(
  "/sponsor/:sponsorId",
  sponsoredHistoryController.deleteVendorSponsor
);

// ########################### GET VENDOR SPONSOR ############################
router.get(
  "/sponsor",
  middleware.auth,
  sponsoredHistoryController.getVendorSponsor
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- ORDERS API -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ########################### GET ORDERS  ############################
router.get("/orders", middleware.auth, vendorOrderController.getOrders);

// ########################### GET ORDER DETAILS ############################
router.get(
  "/orders/:orderId",
  [
    param("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
  ],
  middleware.auth,
  vendorOrderController.getOrderDetail
);

// ########################### PACK ORDER ############################
router.patch(
  "/order/pack/:orderId",
  [
    param("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
  ],
  middleware.auth,
  vendorOrderController.packOrder
);

// ########################### DISPATCH ORDER ############################
router.patch(
  "/order/dispatch",
  [
    body("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
    // query("otp")
    //   .isString()
    //   .withMessage("OTP must be a String!")
    //   .notEmpty()
    //   .withMessage("OTP Must not be Empty!")
    //   .isLength({ min: 4, max: 4 })
    //   .withMessage("Invalid OTP Length!"),
  ],
  middleware.auth,
  vendorOrderController.dispatchOrder
);

// ########################### COMPLETE ORDER ############################
router.patch(
  "/order/complete/:orderId",
  [
    param("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("Order Id Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order Id Format!"),
  ],
  middleware.auth,
  vendorOrderController.completeOrder
);

// ########################### RETURN ORDER ############################
router.patch(
  "/order/return",
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
  vendorOrderController.completeReturn
);

// ########################### ADD TRACKING ID ############################
router.post(
  "/order/tracking-id",
  [
    body("orderId")
      .isString()
      .withMessage("OrderId must be a String!")
      .notEmpty()
      .withMessage("OrderId Must not be Empty!")
      .isMongoId()
      .withMessage("Invalid OrderId Format!"),
    body("trackingId")
      .isString()
      .withMessage("trackingId must be a String!")
      .notEmpty()
      .withMessage("trackingId Must not be Empty!"),
  ],
  middleware.auth,
  vendorOrderController.addTrackingId
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- CATEGORY API -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ########################### GET CATEGORIES ############################
router.get(
  "/categories",
  middleware.auth,
  vendorCategoriesController.getCategories
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- EXTERNAL DATA -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ########################### GET ACTIVE CITIES  ############################
router.get(
  "/cities",
  middleware.auth,
  vendorExternalDataController.getActiveCities
);

// ########################### GET SPONSOR DATA  ############################
router.get(
  "/sponsor-data",
  middleware.auth,
  vendorExternalDataController.getSponsorData
);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- AUDIT -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//########################### GET AUDITS ##################################
router.get("/audits", middleware.auth, vendorAuditController.getAudits);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$-------- REVIEWS -------------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//########################### GET REVIEWS ##################################
router.get("/reviews", middleware.auth, vendorReviewController.getReviews);

module.exports = router;
