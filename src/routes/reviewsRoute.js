const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { reviewController } = require("../controllers/reviews");

// ##################################### ADD PRODUCT REVIEW ###################################
router.post("/add", reviewController.addProductReview);

module.exports = router;

// ###################################### GET REVIEWS FOR USER ################################
router.get("/user/:userId", reviewController.getReviewsByUser);

// ###################################### GET REVIEWS BY VENDOR ###############################
router.get("/vendor/:vendorId", reviewController.getReviewsByVendor);

// ###################################### GET REVIEWS BY PRODUCT ID ###############################
router.get("/product/:productId", reviewController.getReviewsByProductId);
