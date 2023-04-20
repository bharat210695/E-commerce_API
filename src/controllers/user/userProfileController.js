const createError = require("http-errors");
const { validationResult } = require("express-validator");
const UserModel = require("../../models/userModel");
const ProductModel = require("../../models/productModel");
const NotificationModel = require("../../models/notificationModel");
const { default: mongoose } = require("mongoose");
const ImageKit = require("imagekit");
const externalDataModel = require("../../models/externalDataModel");
const cartModel = require("../../models/cartModel");
const notificationModel = require("../../models/notificationModel");
const contactUsModel = require("../../models/contactUsModel");
const ObjectId = mongoose.Types.ObjectId;

//################################ GET USER BASIC DETAILS ##########################################
const getUserBasicDetails = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const user = await UserModel.findById(mongoose.Types.ObjectId(id));
    if (!user) {
      return next(createError(404, "User not found!"));
    }
    const cities = await externalDataModel.findOne({
      title: "available_cities",
    });
    const notificationCount = await NotificationModel.find({
      "subscribers.uid": id,
      "subscribers.seen": false,
    }).countDocuments();

    const cartItems = await cartModel.find(
      { userId: id },
      {
        productId: 1,
      }
    );

    return res.status(200).json({
      status: true,
      data: {
        email: user.email,
        phone: user.phone,
        name: user.name,
        id: user._id,
        cartItems: cartItems,
        wishlist: user.wishlist,
        subscriptions: user.subscriptions,
        cities: cities,
        notificationCount: notificationCount,
      },
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################ GET USER FULL DETAILS ##########################################
const getUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id } = req.user;

    const user = await UserModel.findById(mongoose.Types.ObjectId(id), {
      password: 0,
      loginAttemptsLeft: 0,
    });
    if (!user) {
      return next(createError(404, "User not found!"));
    }
    return res.status(200).json({
      status: true,
      data: user,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################ CHANGE USER PROFILE PICTURE ##########################################
const changeUserImage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const { image, imageName } = req.body;
    var imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    const user = await UserModel.findById(mongoose.Types.ObjectId(id));
    if (!user) {
      return next(createError(500, "user not found for the given id!"));
    }

    const response = await imagekit.upload({
      file: image, //required
      fileName: imageName, //required
      folder: `WEM/user/${id}`,
    });
    if (user.imageFileId) {
      await imagekit.deleteFile(user.imageFileId);
    }

    user.imageFileId = response.fileId;
    user.image = response.url;
    user.thumbnailUrl = response.thumbnailUrl;
    await user.save();
    const data = {
      image: response.url,
      imageFileId: response.fileId,
      thumbnailUrl: response.thumbnailUrl,
    };
    return res.status(200).json({ status: true, data: data });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################# ADD ITEM TO WISHLIST  #######################################//
const addToWishlist = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const { productId } = req.query;
    await UserModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(id),
      },
      {
        $addToSet: { wishlist: productId },
      }
    );
    return res.status(200).json({ message: "success", status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################# GET USER WISHLIST #######################################//
const getWishlist = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await UserModel.findById(mongoose.Types.ObjectId(id));
    if (!user) {
      return next(createError(404, "User not found!"));
    }
    if (user.wishlist.length <= 0) {
      return res.status(200).json({ data: [], status: true });
    }

    const promiseArray = user.wishlist.map((productId) => {
      return new Promise((resolve, reject) => {
        ProductModel.findById(mongoose.Types.ObjectId(productId))
          .then((product) => {
            if (!product)
              return reject({
                message: `product not found for the product id ${productId}`,
              });
            if (product.status !== "active")
              return reject({
                message: `The product currently not avaliable`,
              });
            return resolve(product);
          })
          .catch((err) => {
            return reject(err.message);
          });
      });
    });
    const response = await Promise.allSettled(promiseArray); // return [fulfilled, rejected]
    const responseObj = response.filter((item) => item.status === "fulfilled");
    const products = responseObj.map((item) => item.value);
    return res.status(200).json({ data: products, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################# DELETE FROM WISHLIST #######################################//
const deleteWishlistItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { id } = req.user;
    const { productId } = req.query;
    const response = await UserModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(id),
      },
      {
        $pull: { wishlist: productId },
      }
    );

    if (response.modifiedCount === 1) {
      return res.status(200).json({ message: "success", status: true });
    }

    return res.status(501).json({
      message: "failed to remove item from the wishlist",
      status: false,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################# GET ALL NOTIFICATOINS #######################################//
const getNotifications = async (req, res, next) => {
  try {
    const { id } = req.user;
    const notifications = await NotificationModel.find(
      { "subscribers.uid": id },
      {
        type: 1,
        title: 1,
        description: 1,
        vendorId: 1,
        _id: 1,
        createdAt: 1,
        type: 1,
        subscribers: { $elemMatch: { uid: id } }, //return only the matching array element from the array
      }
    );
    return res.status(200).json({ data: notifications, status: true });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//################################# UPDATE NOTIFICATIONS SEEN #######################################//
const updateNotificationSeen = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { notificationId, docId } = req.query;

    // notificationId = document id
    // docId = document -> array -> id

    const notifications = await NotificationModel.updateOne(
      { _id: ObjectId(notificationId), "subscribers._id": docId },
      {
        $set: {
          "subscribers.$.seen": true,
        },
      }
    );
    if (notifications.modifiedCount === 0) {
      return next(createError(401, "Some Error Occured!"));
    }
    return res.status(200).json({ message: "Success!", status: true });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//################################# CONTACT ADMIN #######################################//
const contactAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { email, message } = req.body;

    let unresolvedMessageExists = await contactUsModel.findOne({
      email: email,
      resolved: false,
    });

    if (unresolvedMessageExists) {
      return next(
        createError(
          406,
          "Issue already Exists! Wait For it to be resolved to raise another issue!"
        )
      );
    }
    await contactUsModel.create({ email, message });
    return res.status(200).json({
      message:
        "You Message has been sent! Our Admin will Reach Out to you Soon!",
      status: true,
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getUserBasicDetails,
  getUserProfile,
  changeUserImage,
  getWishlist,
  deleteWishlistItem,
  addToWishlist,
  getNotifications,
  updateNotificationSeen,
  contactAdmin,
};
