const authController = require("./authController");
const adminVendorController = require("./adminVendorController");
const adminUserController = require("./adminUserController");
const adminProductController = require("./adminProductController");
const adminDeliveryPartnerController = require("./adminDeliveryPartnerController");
const adminCategoryController = require("./adminCategoryController");
const adminExternalDataController = require("./adminExternalDataController");
const sponsorHistoryController = require("./adminSponsorController");
const adminAuditController = require("./adminAuditController");
const adminOrderController = require("./adminOrderController");

module.exports = {
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
};
