const express = require("express");
const { body, param, query } = require("express-validator");
const { scraper1, getAddresses } = require("../controllers/scrapeController");
const router = express.Router();

//####################### SCRAPE TRIAL ###############################
router.post(
  "",
  [
    body("url").isURL().withMessage("Invalid Url!").trim(),
    body("coinSymbol")
      .notEmpty()
      .withMessage("Coin Symbol Required")
      .isString()
      .withMessage("Invalid Coin Symbol")
      .trim()
      .toLowerCase(),
  ],
  scraper1
);

//####################### GET ADDRESSES ###############################
router.get(
  "",
  [
    query("coinSymbol")
      .notEmpty()
      .withMessage("Coin Symbol Required")
      .isString()
      .withMessage("Invalid Coin Symbol")
      .trim()
      .toLowerCase(),
    query("startIndex")
      .notEmpty()
      .withMessage("startIndex Required")
      .isInt()
      .withMessage("startIndex must be an Integer!"),
    query("endIndex")
      .notEmpty()
      .withMessage("endIndex Required")
      .isInt()
      .withMessage("endIndex must be an Integer!"),
  ],
  getAddresses
);

module.exports = router;
