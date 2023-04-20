const express = require("express");
const router = express.Router();
const middleware = require("../middleware/auth");

const { body, param, query, check } = require("express-validator");
const {
  authController,
  addressController,
  userProfileController,
  userCartController,
  userProductController,
  userSubsriptionController,
  orderController,
  userVendorController,
  userExternalDataController,
} = require("../controllers/user");
const { auth } = require("../middleware/auth");

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ AUTH $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$//

//####################### SEND OTP FOR USER REGISTRATION WITH EMAIL ###############################
router.post(
  "/email-registration/send-otp",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email!")
      .normalizeEmail()
      .trim(),
  ],
  authController.sendEmailOtpVerificationMail
);

//####################### VALIDATE OTP AND REGISTER USER WITH EMAIL ###############################
router.post(
  "/email-registration/validate-otp",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email!")
      .normalizeEmail()
      .trim(),
    body("name")
      .isString()
      .withMessage("Name must be a string!")
      .isLength({ min: 5, max: 15 })
      .withMessage("Name Field must be between 5 to 15 characters!"),
    body("password")
      .isString()
      .withMessage("Password must be a string!")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6 to 15 characters!"),
    body("sessionToken")
      .isString()
      .withMessage("Session Token must be a string!"),
    body("otp").isString().withMessage("OTP must be a string!"),
  ],
  authController.userRegisterWithEmail
);

//####################### REGISTER USER WITH PHONE ###############################
router.post(
  "/phone-registration",
  [
    body("phone")
      .trim()
      .isString()
      .withMessage("Invalid Format!")
      .isLength({ max: 10, min: 10 })
      .withMessage("Invalid Format!"),
    body("name")
      .isString()
      .withMessage("Name must be a string!")
      .isLength({ min: 5, max: 15 })
      .withMessage("Name Field must be between 5 to 15 characters!"),
    body("password")
      .isString()
      .withMessage("Password must be a string!")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6 to 15 characters!"),
  ],
  authController.userRegisterWithPhone
);

//####################### LOGIN USER WITH EMAIL ###############################
router.post(
  "/login/email",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email!")
      .normalizeEmail()
      .trim(),
    body("password")
      .isString()
      .withMessage("Password must be a string!")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6 to 15 characters!"),
  ],
  authController.loginUserWithEmail
);

//####################### LOGIN USER WITH PHONE ###############################
router.post(
  "/login/phone",
  [
    body("phone")
      .isString()
      .withMessage("Invalid Format!")
      .isLength({ max: 10, min: 10 })
      .withMessage("Invalid Format!"),
    body("password")
      .isString()
      .withMessage("Password must be a string!")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6 to 15 characters!"),
  ],
  authController.loginUserWithPhone
);

//####################### SEND OTP FOR EMAIL VALIDATION ###############################
router.post(
  "/email-validation/send-otp",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email!")
      .normalizeEmail()
      .trim(),
  ],
  auth,
  authController.sendEmailOtp
);

//####################### VALIDATE AND ADD EMAIL ###############################
router.post(
  "/email-validation/validate-otp",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email!")
      .normalizeEmail()
      .trim(),
    body("sessionToken")
      .isString()
      .withMessage("Session Token must be a string!"),
    body("otp").isString().withMessage("OTP must be a string!"),
  ],
  auth,
  authController.validateEmail
);

//####################### ADD PHONE NUMBER ###############################
router.post(
  "/phone-validation",
  [
    body("phone")
      .trim()
      .isString()
      .withMessage("Invalid Format!")
      .isLength({ max: 10, min: 10 })
      .withMessage("Invalid Format!"),
  ],
  middleware.auth,
  authController.addPhoneNumber
);

//####################### SEND OTP FOR FORGOT PASSWORD (EMAIL) ###############################
router.post(
  "/forgot-password/send-otp",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email!")
      .normalizeEmail()
      .trim(),
  ],
  authController.sendOtpForForgotPassword
);

//####################### CHANGE PASSWORD AFTER FORGOT PASSWORD (EMAIL) ###############################
router.post(
  "/forgot-password/validate-otp",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email!")
      .normalizeEmail()
      .trim(),
    body("sessionToken")
      .isString()
      .withMessage("Session Token must be a string!"),
    body("otp").isString().withMessage("OTP must be a string!"),
    body("password")
      .isString()
      .withMessage("Password must be a string!")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6 to 15 characters!"),
  ],
  authController.changePassword
);

//####################### CHANGE PASSWORD WITH PHONE ###############################
router.post(
  "/change-password/phone",
  [
    body("phone")
      .trim()
      .isString()
      .withMessage("Invalid Format!")
      .isLength({ max: 10, min: 10 })
      .withMessage("Invalid Format!"),
    body("password")
      .isString()
      .withMessage("Password must be a string!")
      .isLength({ min: 6, max: 15 })
      .withMessage("Password must be between 6 to 15 characters!"),
  ],
  authController.changePasswordWithPhone
);

//####################### RESET PASSWORD WITH OLD PASSWORD ###############################
router.patch(
  "/reset-password",
  auth,
  [
    body("oldPassword")
      .notEmpty()
      .withMessage("Old password required")
      .isLength({ min: 8, max: 15 })
      .withMessage("Old password must be between 8 to 15 characters"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password required")
      .isLength({ min: 8, max: 15 })
      .withMessage("New password must be between 8 to 15 characters"),
  ],
  authController.resetPassword
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ ADDRESS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$//

//####################### GET USER ADDRESSES ###############################
router.get("/addresses", auth, addressController.getAddressesByID);

//####################### ADD NEW USER ADDRESSES ###############################
router.post(
  "/addresses",
  auth,
  [
    body("address").notEmpty().withMessage("address is required").trim(),
    body("landmark").notEmpty().withMessage("landmark is required").trim(),
    body("city").notEmpty().withMessage("city is required").trim(),
    body("state").notEmpty().withMessage("state is required").trim(),
    body("pincode")
      .notEmpty()
      .withMessage("pincode is required")
      .isNumeric()
      .isLength({ min: 6, max: 6 })
      .withMessage("pincode must be between 6 to 15 characters!"),
  ],
  addressController.addNewAddress
);

//####################### DELETE  USER ADDRESS ###############################
router.delete(
  "/addresses/:addressId",
  auth,
  addressController.deleteUserAddress
);

//####################### UPDATE USER ADDRESSES ###############################
router.patch(
  "/addresses",
  auth,
  [
    body("addressId")
      .notEmpty()
      .withMessage("address id is required")
      .isMongoId()
      .withMessage("invalid address id"),
    body("address").notEmpty().withMessage("address is required").trim(),
    body("landmark").notEmpty().withMessage("landmark is required").trim(),
    body("city").notEmpty().withMessage("city is required").trim(),
    body("state").notEmpty().withMessage("state is required").trim(),
    body("pincode")
      .notEmpty()
      .withMessage("pincode is required")
      .isNumeric()
      .isLength({ min: 6, max: 6 })
      .withMessage("pincode must be 6 digit"),
  ],
  addressController.updateAddress
);

//####################### SET USER DEFAULT ADDRESSES ###############################
router.patch(
  "/addresses/default-address",
  auth,
  [body("addressId").isMongoId().withMessage("Invalid address id!")],
  addressController.setDefaultAddress
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ ORDER API $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$//

//####################### CREATE ORDER ###############################
router.post(
  "/order",
  auth,
  [
    body("deliveryType")
      .notEmpty()
      .withMessage("Delivery Type required")
      .isIn(["agent", "courier"])
      .withMessage("delivery type must be one of agent or courier"),
    body("deliveryPartnerId").custom((value, { req }) => {
      if (req.body.deliveryType === "agent") {
        if (!value) {
          throw new Error("Delivery Partner Id required");
        }
        return true;
      } else {
        return true;
      }
    }),
    // body("addressId")
    //   .notEmpty()
    //   .withMessage("User address  id required")
    //   .isMongoId()
    //   .withMessage("invalid address id"),
    // body("products")
    //   .notEmpty()
    //   .withMessage("products required")
    //   .isArray()
    //   .withMessage("prodcuts must be in array format"),
  ],
  orderController.createOrder
);

//####################### GET DELIVERY CHARGE  ###############################
router.get(
  "/delivery-charge",
  auth,
  [query("cityTo").notEmpty().withMessage("City required")],
  orderController.getDeliveryCharge
);

//####################### GET CUSTOMER ORDERS (PAGINATION)  ###############################
router.get("/orders", auth, orderController.getOrders);

//####################### GET ORDER DETAILS  ###############################
router.get(
  "/orders/:orderId",
  auth,
  [
    param("orderId")
      .trim()
      .notEmpty()
      .withMessage("Order ID must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order ID Format"),
  ],
  orderController.getOrderDetails
);

//####################### CANCEL ORDER  ###############################
router.patch(
  "/cancel-order/:orderId",
  auth,
  [
    param("orderId")
      .trim()
      .notEmpty()
      .withMessage("Order ID must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order ID Format"),
  ],
  orderController.cancelOrder
);

//####################### RETURN ORDER  ###############################
router.patch(
  "/return-order",
  auth,
  [
    body("orderId")
      .trim()
      .notEmpty()
      .withMessage("Order ID must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order ID Format"),
    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Reason must not be Empty!")
      .isString()
      .withMessage("Reason must be String!")
      .isIn(["1", "2", "3"])
      .withMessage("Invalid Reason!"),
  ],
  orderController.returnOrder
);

//####################### REVIEW ORDER  ###############################
router.patch(
  "/review-order",
  auth,
  [
    body("orderId")
      .trim()
      .notEmpty()
      .withMessage("Order ID must not be Empty!")
      .isMongoId()
      .withMessage("Invalid Order ID Format"),

    body("rating")
      .trim()
      .notEmpty()
      .withMessage("Rating must not be Empty!")
      .isInt({ min: 1, max: 5 })
      .withMessage("Invalid Rating!"),
  ],
  orderController.reviewOrder
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ PROFILE $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$//

//####################### GET USER DETAILS ###############################
router.get(
  "/profile/basic-details",
  auth,
  userProfileController.getUserBasicDetails
);

//####################### GET USER FULL DETAILS ###############################
router.get("/profile/details", auth, userProfileController.getUserProfile);

//####################### CHANGE USER IMAGE ###############################
router.patch(
  "/profile/change-image",
  auth,
  [
    body("image").notEmpty().withMessage("image required"),
    body("imageName").notEmpty().withMessage("image name required"),
  ],
  userProfileController.changeUserImage
);

//####################### GET USER WISHLIST ###############################
router.get("/wishlist", auth, userProfileController.getWishlist);

//####################### ADD ITEM TO WISHLIST ###############################
router.post(
  "/wishlist",
  auth,
  [
    query("productId")
      .notEmpty()
      .withMessage("product id required")
      .isMongoId()
      .withMessage("invalid product id"),
  ],
  userProfileController.addToWishlist
);

//####################### DELETE WISHLIST ITEM ###############################
router.delete(
  "/wishlist",
  auth,
  [
    query("productId")
      .notEmpty()
      .withMessage("productId Required")
      .isMongoId()
      .withMessage("Invalid productId!"),
  ],
  userProfileController.deleteWishlistItem
);

//####################### CONTACT ADMIN ###############################
router.post(
  "/contact-us",
  [
    body("email")
      .notEmpty()
      .withMessage("Email Required")
      .isEmail()
      .withMessage("Invalid Email!"),
    body("message")
      .notEmpty()
      .withMessage("Message Required")
      .isString()
      .withMessage("Invalid Message!"),
  ],
  userProfileController.contactAdmin
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ CART $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$//

//####################### ADD ITEM TO CART (REGISTERED USER) ###############################
router.post(
  "/cart",
  auth,
  [
    body("productId").isMongoId().withMessage("Invalid Product ID!"),
    body("sizeId").isMongoId().withMessage("Invalid Size ID!"),
    body("colorId").isMongoId().withMessage("Invalid Color ID!"),
  ],
  userCartController.addToCart
);

//####################### UPDATE CART ITEM(REGISTERED USER) ###############################
router.patch(
  "/cart",
  auth,
  [
    body("cartItemId").isMongoId().withMessage("Invalid cartItem ID!"),
    body("type")
      .notEmpty()
      .withMessage("Type Required!!")
      .isIn(["inc", "dec"])
      .withMessage("Invalid Type!"),
  ],
  userCartController.updateCartItem
);
//####################### REMOVE CART ITEM(REGISTERED USER) ###############################
router.delete("/cart/:cartItemId", auth, userCartController.removeCartItem);

//####################### REMOVE  CART ITEM(REGISTERED USER) ###############################
// router.patch(
//   "/cart/remove/:productId",
//   auth,
//   [param("productId").isMongoId().withMessage("invalid product id")],
//   userCartController.removeCartItem
// );

//####################### ADD MULTIPLE CART ITEMS ITEM(REGISTERED USER) ###############################
router.post(
  "/cart/add-multiple",
  auth,
  [
    body("cart")
      .notEmpty()
      .withMessage("Cart Array Required!")
      .isArray()
      .withMessage("Invalid Cart Type!"),
    check("cart.*.productId")
      .notEmpty()
      .withMessage("Product ID Required!")
      .isMongoId()
      .withMessage("Invalid Product ID Format!"),
    check("cart.*.qty")
      .notEmpty()
      .withMessage("Qty Required!")
      .isInt()
      .withMessage("Invalid Qty!"),
    check("cart.*.colorId")
      .notEmpty()
      .withMessage("Color ID Required!")
      .isMongoId()
      .withMessage("Invalid Color ID Format!"),
    check("cart.*.sizeId")
      .notEmpty()
      .withMessage("Size ID Required!")
      .isMongoId()
      .withMessage("Invalid Size ID Format!"),
    check("cart.*.productDetails")
      .notEmpty()
      .withMessage("Product Details Required!")
      .isObject()
      .withMessage("Invalid Product Details!"),
  ],
  userCartController.addMultipleCartItems
);

//####################### GET USER CART ###############################
router.get("/cart", auth, userCartController.getUserCart);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ PRODUCT $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//#########################  GET PRODUCTS  ###################################
router.get("/products", userProductController.getProducts);

//#########################  GET SPONSORED PRODUCTS  ###################################
router.get("/sponsored-products", userProductController.getSponsoredProducts);

//#########################  GET PRODUCT BY ID  ###################################
router.get("/products/:productId", userProductController.getProductsByID);

//#########################  GET PRODUCTS BY VENDOR ID  ###################################
router.get(
  "/vendor-products",
  [
    query("vendorId")
      .trim()
      .notEmpty()
      .withMessage("Vendor ID Required!")
      .isMongoId()
      .withMessage("Invalid Vendor ID!"),
  ],
  userProductController.getProductsByVendorId
);

//#########################  SEARCH PRODUCTS  ###################################
router.get(
  "/search-products",
  [query("title").trim().notEmpty().withMessage("Title Must Not be Empty!")],
  userProductController.searchProducts
);

//#########################  GET PRODUCT REVIEWS  ###################################
router.get(
  "/product-reviews",
  query("productId")
    .notEmpty()
    .withMessage("productId is Required!")
    .isMongoId()
    .withMessage("Invalid Product ID!"),
  userProductController.getProductReviews
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ VENDOR $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//#########################  GET VENDORS  ###################################
router.get("/vendors", userVendorController.getVendors);

//#########################  GET VENDOR PRODUCTS BY VENDOR ID  ###################################
router.get(
  "/vendor-details",
  [
    query("vendorId")
      .trim()
      .notEmpty()
      .withMessage("Vendor ID Required!")
      .isMongoId()
      .withMessage("Invalid Vendor ID!"),
  ],
  userVendorController.getVendorProducts
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
  userVendorController.getVendorReviews
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ SUBSCRIPTIONS $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//#########################  SUBSCRIBE VENDOR  ###################################
router.patch(
  "/subscribe-vendor/:vendorId",
  auth,
  [
    param("vendorId")
      .notEmpty()
      .withMessage("vendor id required")
      .isMongoId()
      .withMessage("invalid vendor id"),
  ],
  userSubsriptionController.subscribeVendor
);

//######################### GET SUBSCRIBE VENDOR WITH PRODUCT  ###################################
router.get(
  "/subscribed-vendors",
  auth,
  userSubsriptionController.getSubscribedVendors
);

//######################### REMOVE SUBSCRIBE VENDOR  ###################################
router.patch(
  "/unsubscribe-vendor/:vendorId",
  auth,
  userSubsriptionController.deleteSubscription
);

//######################### TOOGLE A VENDOR NOTIFICATION BY VENDOR ID ###################################
router.patch(
  "/vendor-notification",
  auth,
  [
    query("vendorId")
      .notEmpty()
      .withMessage("Vendor ID Required!")
      .isMongoId()
      .withMessage("Invalid Vendor ID!"),
    query("status")
      .notEmpty()
      .withMessage("Status Required!")
      .isBoolean()
      .withMessage("Invalid Status!"),
  ],
  userSubsriptionController.toggleNotification
);

//######################### GET NOTIFICATIONS  ###################################
router.get("/notification", auth, userProfileController.getNotifications);

//######################### CHANGE NOTIFICATIONS SEEN  ###################################
router.patch(
  "/notification",
  auth,
  [
    query("notificationId")
      .notEmpty()
      .withMessage("Notification ID Required!")
      .isMongoId()
      .withMessage("Invalid Notification ID!"),
    query("docId")
      .notEmpty()
      .withMessage("Doc ID Required!")
      .isMongoId()
      .withMessage("Invalid Doc ID!"),
  ],
  userProfileController.updateNotificationSeen
);

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ EXTERNAL DATA $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//######################### GET ACTIVE CITIES  ###################################
router.get("/cities", userExternalDataController.getActiveCities);

module.exports = router;
