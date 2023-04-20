const express = require("express");
const router = express.Router();

// test-api
router.get("/test", function(req, res) {
  return res
    .status(200)
    .json({ status: true, message: "test api working fine" });
});
// test-api
router.post("/test", function(req, res) {
  return res
    .status(200)
    .json({ status: true, message: "test post api working fine" });
});

module.exports = router;