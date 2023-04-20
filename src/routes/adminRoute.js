const express = require("express");
const router = express.Router();
const { body, param, query, check } = require("express-validator");

const {
  authController,
  adminVendorController,
  adminProductController,
  adminUserController,
  adminDeliveryPartnerController,
  adminCategoryController,
  adminExternalDataController,
  sponsorHistoryController,
  adminAuditController,
  adminOrderController,
} = require("../controllers/admin");
const {
  primaryOrSecondaryAdminCheck,
  primaryAdminCheck,
  adminCheck,
} = require("../middleware/adminAuth");

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-------ADMIN------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//######################### CREATE NEW ADMIN ###################################
router.post(
  "",
  primaryAdminCheck,
  [
    body("name").notEmpty().withMessage("Name is Required!").trim(),
    body("email")
      .notEmpty()
      .withMessage("Email is Required!")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid Email Address!")
      .trim(),
    body("password")
      .notEmpty()
      .withMessage("Password can not be Empty!")
      .isLength({ min: 8, max: 15 })
      .withMessage("Password must be atleast 8 Characters Long!"),

    body("role")
      .notEmpty()
      .withMessage("Role can not be Empty!")
      .isIn(["primary", "secondary", "read-only"])
      .withMessage("Invalid Role!")
      .trim(),
  ],
  authController.createAdmin
);

//#########################  ADMIN LOGIN ROUTE ###################################
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("invalid email address")
      .trim(),
    body("password")
      .notEmpty()
      .withMessage("password can not be empty")
      .isLength({ min: 8, max: 15 })
      .withMessage("password must be atleast 8 characters long"),
  ],
  authController.adminLogin
);
//#########################  ADMIN CHECK AUTH ###################################
router.get("/auth", adminCheck, authController.checkAuth);
//#########################  ADMIN GET DASHBOARD DATA ###################################
router.get("/dashboard", adminCheck, authController.getAdminDashboard);

//#########################  GET ALL ADMINS ROUTE  ###################################
router.get("", primaryAdminCheck, authController.getAdmins);

//#########################  DELETE ADMIN BY ID  ###################################
router.delete(
  "/:adminId",
  param("adminId").notEmpty().isMongoId().withMessage("invalid id provided"),
  primaryAdminCheck,
  authController.deleteAdmin
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-------VENDORS------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//#########################  GET ALL VENDORS  ###################################
router.get("/vendors", adminCheck, adminVendorController.getAllVendors);

//#########################  GET VENDOR BY ID  ###################################
router.get(
  "/vendors/:vendorId",
  adminCheck,
  param("vendorId").isMongoId().withMessage("Invalid Vendor ID Provided!"),
  adminVendorController.getVendorById
);

//#########################  DELETE VENDOR BY ID  ###################################
router.delete(
  "/vendors/:vendorId",
  adminCheck,
  param("vendorId").isMongoId().withMessage("Invalid Vendor ID Provided!"),
  adminVendorController.deleteVendor
);

//#########################  UPDATE VENDOR STATUS  ###################################
router.patch(
  "/vendors",
  primaryOrSecondaryAdminCheck,
  [
    body("status")
      .notEmpty()
      .withMessage("Status cannot be Empty!")
      .isIn(["approved", "rejected", "disabled"])
      .withMessage("Invalid Status Provided!"),
    body("vendorId")
      .notEmpty()
      .withMessage("Vendor ID cannot be Empty!")
      .isMongoId()
      .withMessage("Invalid Vendor ID!"),
  ],
  adminVendorController.updateVendorStatus
);

//#########################  GET VENDOR REVIEWS  ###################################
router.get(
  "/vendor-reviews",
  [
    query("vendorId")
      .trim()
      .notEmpty()
      .withMessage("Vendor ID Required!")
      .isMongoId()
      .withMessage("Invalid Vendor ID!"),
  ],
  adminCheck,
  adminVendorController.getVendorReviews
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-------USERS------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//#########################  GET ALL USERS  ###################################
router.get("/users", adminCheck, adminUserController.getAllUsers);

//#########################  GET USER BY EMAIL  ###################################
router.get(
  "/users/email/:email",
  adminCheck,
  param("email").notEmpty().withMessage("Email Required!"),
  adminUserController.getUserByEmail
);

//#########################  GET USER BY PHONE  ###################################
router.get(
  "/users/phone/:phone",
  adminCheck,
  param("phone").notEmpty().withMessage("Phone Required!"),
  adminUserController.getUserByPhone
);

//#########################  UNBLOCK USER  ###################################
router.patch(
  "/block-user/:userId",
  primaryOrSecondaryAdminCheck,
  [
    param("userId")
      .notEmpty()
      .withMessage("User ID Required!")
      .isMongoId()
      .withMessage("Invalid User ID Provided!"),
  ],
  adminUserController.blockUser
);

//#########################  BLOCK USER  ###################################
router.patch(
  "/unblock-user/:userId",
  primaryOrSecondaryAdminCheck,
  [
    param("userId")
      .notEmpty()
      .withMessage("User ID Required!")
      .isMongoId()
      .withMessage("Invalid User ID Provided!"),
  ],
  adminUserController.unblockUser
);

//#########################  GET USER MESSAGES  ###################################
router.get("/messages", adminCheck, adminUserController.getUserMessages);

//#########################  RESOLVE USER MESSAGES  ###################################
router.patch(
  "/messages/:messageId",
  primaryOrSecondaryAdminCheck,
  adminUserController.resolveUserMessages
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-------PRODUCTS------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//#########################  GET ALL PRODUCTS  ###################################
router.get("/products", adminCheck, adminProductController.getAllProducts);

//#########################  GET PRODUCT BY ID  ###################################
router.get(
  "/products/:productId",
  adminCheck,
  param("productId").isMongoId().withMessage("Invalid Product ID!"),
  adminProductController.getProductById
);

//#########################  GET PRODUCT REVIEWS  ###################################
router.get(
  "/product-reviews",
  adminCheck,
  query("productId")
    .notEmpty()
    .withMessage("productId is Required!")
    .isMongoId()
    .withMessage("Invalid Product ID!"),
  adminProductController.getProductReviews
);

//#########################  UPDATE PRODUCT STATUS  ###################################
router.patch(
  "/products",
  primaryOrSecondaryAdminCheck,
  [
    query("status")
      .notEmpty()
      .withMessage("Status Required!")
      .isIn(["active", "disabled"])
      .withMessage("Invalid Status!"),
    query("productId")
      .notEmpty()
      .withMessage("Product ID Required!")
      .isMongoId()
      .withMessage("Invalid Product ID!"),
  ],
  adminProductController.updateProductStatus
);

//#########################  DELETE PRODUCT  ###################################
router.delete(
  "/products/:productId",
  primaryOrSecondaryAdminCheck,
  param("productId").isMongoId().withMessage("Invalid Product ID!"),
  adminProductController.deleteProduct
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-------DELIVERY PARTNER------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//######################### ADD NEW DELIVERY PARTNER  ###################################
router.post(
  "/delivery-partner",
  primaryOrSecondaryAdminCheck,
  [
    body("name")
      .notEmpty()
      .withMessage("Delivery Partner name is required")
      .trim(),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("invalid email address")
      .trim(),
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isMobilePhone("en-IN", { strictMode: true })
      .withMessage("Invalid Phone Number!")
      .trim(),
    body("password")
      .notEmpty()
      .withMessage("password can not be empty")
      .isLength({ min: 8, max: 15 })
      .withMessage("password must be atleast 8 characters long")
      .trim(),
    body("address").isObject().withMessage("Address Must be Object!"),
    check("address.pincode")
      .isString()
      .withMessage("Pincode Must be String!")
      .isLength({ min: 6, max: 6 })
      .withMessage("Invalid Pincode!"),
    body("cities").isArray({ min: 1 }),
  ],
  adminDeliveryPartnerController.addNewDeliveryPartner
);

//######################### UPDATE DELIVERY PARTNER  ###################################
router.patch(
  "/delivery-partner",
  primaryOrSecondaryAdminCheck,
  [
    body("id")
      .notEmpty()
      .withMessage("Delivery Partner ID is required")
      .isMongoId()
      .withMessage("Invalid ID!")
      .trim(),
    body("name")
      .notEmpty()
      .withMessage("Delivery Partner name is required")
      .trim(),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("invalid email address")
      .trim(),
    body("phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .isMobilePhone("en-IN", { strictMode: true })
      .withMessage("Invalid phone number")
      .trim(),
    body("cities").isArray({ min: 1 }).withMessage("Cities Required!"),
  ],
  adminDeliveryPartnerController.updateDeliveryPartner
);

//######################### GET ALL DELIVERY PARTNERS   ###################################
router.get(
  "/delivery-partner",
  adminCheck,

  adminDeliveryPartnerController.getAllDeliveryPartner
);

//######################### GET A DELIVERY PARTNER DETAILS BY ID   ###################################
router.get(
  "/delivery-partner/:deliveryPartnerId",
  adminCheck,
  [
    param("deliveryPartnerId")
      .notEmpty()
      .withMessage("Delivery partner ID can not be empty!")
      .isMongoId()
      .withMessage("Invalid delivery partner ID!")
      .trim(),
  ],
  adminDeliveryPartnerController.getDeliveryPartnerById
);

//######################### BLOCK A DELIVERY PARTNER DETAILS BY ID   ###################################
router.patch(
  "/delivery-partner/block/:deliveryPartnerId",
  primaryOrSecondaryAdminCheck,
  [
    param("deliveryPartnerId")
      .notEmpty()
      .withMessage("Delivery partner ID can not be empty!")
      .isMongoId()
      .withMessage("Invalid delivery partner ID!")
      .trim(),
  ],
  adminDeliveryPartnerController.blockDeliveryPartnerById
);

//######################### UN-BLOCK A DELIVERY PARTNER DETAILS BY ID   ###################################
router.patch(
  "/delivery-partner/unblock/:deliveryPartnerId",
  primaryOrSecondaryAdminCheck,
  [
    param("deliveryPartnerId")
      .notEmpty()
      .withMessage("Delivery partner ID can not be empty!")
      .isMongoId()
      .withMessage("Invalid delivery partner ID!")
      .trim(),
  ],
  adminDeliveryPartnerController.unBlockDeliveryPartnerById
);

//######################### DELETE DELIVERY PARTNER  ###################################
router.delete(
  "/delivery-partner/:deliveryPartnerId",

  primaryOrSecondaryAdminCheck,
  adminDeliveryPartnerController.deleteDeliveryPartner
);

//######################### ADD DELIVERY CHARGES  ###################################
router.patch(
  "/delivery-partner/charges",
  [
    body("deliveryPartnerId")
      .notEmpty()
      .withMessage("Delivery Partner ID must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Delivery Partner ID Format!"),
    body("charges")
      .notEmpty()
      .withMessage("Charges must not be Empty!")
      .isArray()
      .withMessage("Invalid Charges Data Type!"),
  ],
  primaryOrSecondaryAdminCheck,
  adminDeliveryPartnerController.addDeliveryCharges
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-------CATEGORIES------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//######################### ADD NEW CATEGORY  ###################################
router.post(
  "/category",
  primaryOrSecondaryAdminCheck,
  [
    body("category")
      .notEmpty()
      .withMessage("Category Required!")
      .isString()
      .withMessage("Invalid Category Type!")
      .trim(),
  ],
  adminCategoryController.addNewCategory
);

//######################### GET ALL CATEGORiES  ###################################
router.get("/category", adminCheck, adminCategoryController.getCategories);

//######################### UPDATE CATEGORY BY ID  ###################################
router.patch(
  "/category",
  [
    body("category")
      .notEmpty()
      .withMessage("Category Required!")
      .isString()
      .withMessage("Invalid Category Type!")
      .trim(),
    body("categoryId")
      .notEmpty()
      .withMessage("Category ID Required!")
      .isMongoId()
      .withMessage("Invalid Category ID!")
      .trim(),
  ],
  primaryOrSecondaryAdminCheck,
  adminCategoryController.updateCategoryById
);

//######################### GET CATEGORY BY TITLE  ###################################
// router.get(
//   "/category/:category",
//   adminCheck,
//   adminCategoryController.getCategoryByTitle
// );

//######################### DELETE CATEGORY BY ID  ###################################
router.delete(
  "/category/:categoryId",
  primaryOrSecondaryAdminCheck,
  adminCategoryController.deleteCategory
),
  //######################### ADD NEW SUB-CATEGORY  ###################################
  router.post(
    "/sub-category",
    primaryOrSecondaryAdminCheck,
    [
      body("categoryId")
        .notEmpty()
        .withMessage("Category ID is Required!")
        .isMongoId()
        .withMessage("Invalid Category ID")
        .trim(),
      body("subCategory")
        .notEmpty()
        .withMessage("Sub Category Required!")
        .isString()
        .withMessage("Invalid Sub Category Type!")
        .trim(),
    ],
    adminCategoryController.addNewSubCategory
  );

//######################### UPDATE SUB-CATEGORY  ###################################
router.patch(
  "/sub-category",
  primaryOrSecondaryAdminCheck,
  [
    body("categoryId")
      .notEmpty()
      .withMessage("Category ID required!")
      .isMongoId()
      .withMessage("Invalid Category ID!")
      .trim(),
    body("subCategory")
      .notEmpty()
      .withMessage("Sub Category Required!")
      .isString()
      .withMessage("Invalid Sub Category!")
      .trim(),
    body("subCategoryId")
      .notEmpty()
      .withMessage("Sub Category ID Required!")
      .isMongoId()
      .withMessage("Invalid Sub Category ID!")
      .trim(),
  ],
  adminCategoryController.updateSubCategory
);

//######################### DELETE SUB-CATEGORY  ###################################
router.delete(
  "/sub-category/:categoryId/:subCategoryId",
  primaryOrSecondaryAdminCheck,
  adminCategoryController.deleteSubCategory
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-------EXTERNAL DATA API------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//######################### ADD/UPDATE SPONSOR DATA  ###################################
router.post(
  "/external-data/sponsor-data",
  [
    body("totalSlots")
      .notEmpty()
      .withMessage("Total Slots Required")
      .isInt()
      .withMessage("Invalid Total Slots Type!"),
    body("pricePerDayForEachSlot")
      .notEmpty()
      .withMessage("pricePerDayForEachSlot Required")
      .isInt()
      .withMessage("Invalid pricePerDayForEachSlot Type!"),
  ],

  primaryOrSecondaryAdminCheck,
  adminExternalDataController.addSponsorData
);

//######################### GET SPONSOR DATA  ###################################
router.get(
  "/external-data/sponsor-data",
  adminCheck,
  adminExternalDataController.getSponsorData
);

// ############################ GET CITIES ################################
router.get("/cities", adminCheck, adminExternalDataController.getCities);

// ############################ DELETE CITIES ################################
router.delete(
  "/cities/:city",
  primaryOrSecondaryAdminCheck,
  adminExternalDataController.deleteCity
);

// ############################ ADD CITIES  ################################
router.post(
  "/cities",
  [
    body("city")
      .trim()
      .toLowerCase()
      .notEmpty()
      .withMessage("City Required!")
      .isString()
      .withMessage("Invalid City Type!"),
  ],
  primaryOrSecondaryAdminCheck,
  adminExternalDataController.addCities
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$------------ SPONSOR HISTORY -----------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ###################### GET SPONSOR HISTORY ##########################
router.get("/sponsors", adminCheck, sponsorHistoryController.getSponsorHistory);

// ###################### UPDATE SPONSOR STATUS ########################
router.patch(
  "/sponsors",
  primaryOrSecondaryAdminCheck,
  [
    body("sponsorId")
      .notEmpty()
      .withMessage("Sponsor ID Required!")
      .isMongoId()
      .withMessage("Invalid Sponsor ID Format!"),
    body("status")
      .notEmpty()
      .withMessage("Status Required!")
      .isString()
      .withMessage("Invalid Status Type!")
      .isIn(["rejected", "active", "expired"])
      .withMessage("Invalid Status!"),
  ],
  sponsorHistoryController.updateSponsorStatus
);

// ###################### DELETE SPONSOR BY ID #########################
router.delete(
  "/sponsor/:id",
  primaryOrSecondaryAdminCheck,
  sponsorHistoryController.deleteSponsorById
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$------------ ORDERS -----------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// ###################### GET ORDERS #########################
router.get("/orders", adminCheck, adminOrderController.getOrders);

// ###################### GET ORDER DETAILS #########################
router.get("/orders/:orderId", adminCheck, adminOrderController.getOrderDetail);

// ###################### CANCEL ORDER  #########################
router.patch(
  "/orders",
  primaryOrSecondaryAdminCheck,
  [
    body("orderId")
      .notEmpty()
      .withMessage("orderId Required!")
      .isMongoId()
      .withMessage("Invalid orderId!"),
    body("cancelledBy")
      .notEmpty()
      .withMessage("cancelledBy Required!")
      .isString()
      .withMessage("Invalid cancelledBy Type!")
      .isIn(["vendor", "delivery-partner"])
      .withMessage("Invalid cancelledBy!"),
  ],
  adminOrderController.cancelOrder
);

// ###################### COMPLETE COURIER ORDER  #########################
router.patch(
  "/complete-order",
  primaryOrSecondaryAdminCheck,
  [
    body("orderId")
      .notEmpty()
      .withMessage("orderId Required!")
      .isMongoId()
      .withMessage("Invalid orderId!"),
  ],
  adminOrderController.completeCourierOrder
);

// ###################### SEARCH ORDER  #########################
router.get(
  "/search-orders/:orderId",
  adminCheck,
  adminOrderController.searchOrder
);

// ###################### RESOLVE RETURN REQUEST  #########################
router.patch(
  "/return-order",
  [
    body("orderId")
      .notEmpty()
      .withMessage("orderId Required!")
      .isMongoId()
      .withMessage("Invalid orderId!"),
    body("returnStatus")
      .notEmpty()
      .withMessage("returnStatus Required!")
      .isString()
      .withMessage("Invalid returnStatus Type!")
      .isIn(["rejected", "processing"])
      .withMessage("Invalid returnStatus!"),
  ],
  primaryOrSecondaryAdminCheck,
  adminOrderController.resolveReturnRequest
);

// ###################### UPDATE RETURN REFUND STATUS  #########################
router.patch(
  "/return-refund/:orderId",
  primaryOrSecondaryAdminCheck,
  adminOrderController.updateReturnRefundStatus
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$------------ SPONSOR HISTORY -----------------$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//########################### CREATE VENDOR AUDIT ##############################
router.post(
  "/vendor-audit",
  [
    body("vendorId")
      .notEmpty()
      .withMessage("Vendor Id Must not be empty!")
      .isString()
      .withMessage("Vendor Id must be a string")
      .isMongoId()
      .withMessage("Invalid Vendor Id Format!"),
    body("from")
      .notEmpty()
      .withMessage("from field Must not be empty!")
      .isString()
      .withMessage("form field must be a string!"),
    body("to")
      .notEmpty()
      .withMessage("from field Must not be empty!")
      .isString()
      .withMessage("form field must be a string!"),
  ],
  primaryOrSecondaryAdminCheck,
  adminAuditController.createVendorAudit
);

//########################### CREATE DELIVERY PARTNER AUDIT ##############################
router.post(
  "/delivery-audit",
  [
    body("deliveryPartnerId")
      .notEmpty()
      .withMessage("deliveryPartnerId Must not be empty!")
      .isString()
      .withMessage("deliveryPartnerId must be a string")
      .isMongoId()
      .withMessage("IdeliveryPartnerId Format!"),
    body("from")
      .notEmpty()
      .withMessage("from field Must not be empty!")
      .isString()
      .withMessage("form field must be a string!"),
    body("to")
      .notEmpty()
      .withMessage("from field Must not be empty!")
      .isString()
      .withMessage("form field must be a string!"),
  ],
  primaryOrSecondaryAdminCheck,
  adminAuditController.createDeliveryPartnerAudit
);

//########################### DELETE AUDIT ##############################
router.delete(
  "/audit/:auditId",
  primaryOrSecondaryAdminCheck,
  adminAuditController.deleteAudit
);

//########################### GET AUDIT ##############################
router.get(
  "/audits",
  [
    query("id")
      .notEmpty()
      .withMessage("id Must not be empty!")
      .isString()
      .withMessage("id must be a string")
      .isMongoId()
      .withMessage("Invalid Vendor Id Format!"),
    query("auditType")
      .notEmpty()
      .withMessage("auditType Must not be empty!")
      .isString()
      .withMessage("auditType must be a string")
      .isIn(["vendor", "delivery-partner"])
      .withMessage("Invalid auditType!"),
  ],
  adminCheck,
  adminAuditController.getAudits
);

//########################### RESOLVE AUDIT ##############################
router.patch(
  "/audit/:auditId",
  primaryAdminCheck,
  adminAuditController.resolveAudit
);

module.exports = router;
