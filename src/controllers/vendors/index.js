const authController = require("./authController");
const uploadImageController = require("./uploadImageController");
const vendorProductController = require("./vendorProductController");
const sponsoredHistoryController = require("./vendorSponsoredController");
const vendorNotificationController = require("./vendorNotificationController");
const vendorDataController = require("./vendorDataController");
const vendorExternalDataController = require("./vendorExternalDataController");
const vendorOrderController = require("./vendorOrderController");
const vendorCategoriesController = require("./vendorCategoriesController");
const vendorAuditController = require("./vendorAuditController");
const vendorReviewController = require("./vendorReviewController");

module.exports = {
  authController,
  uploadImageController,
  vendorProductController,
  vendorOrderController,
  sponsoredHistoryController,
  vendorExternalDataController,
  vendorNotificationController,
  vendorDataController,
  vendorCategoriesController,
  vendorAuditController,
  vendorReviewController,
};
