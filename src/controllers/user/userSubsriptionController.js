const createError = require("http-errors");
const { validationResult } = require("express-validator");
const UserModel = require("../../models/userModel");
const VendorModel = require("../../models/vendorModel");
const { default: mongoose } = require("mongoose");
const ProductModel = require("../../models/productModel");
const ObjectId = mongoose.Types.ObjectId;

//################################ SUBSCRIBE VENDOR ##########################################
const subscribeVendor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id } = req.user;
    const { vendorId } = req.params;

    const user = await UserModel.findById(mongoose.Types.ObjectId(id));
    if (!user) {
      return next(createError(404, "User not found!"));
    }

    const index = user.subscriptions.findIndex(
      (item) => item.vendorId === vendorId
    );
    if (index > -1) {
      return next(createError(406, "Already subscribed"));
    }
    user.subscriptions.push({ vendorId: vendorId, showNotifications: true });
    await user.save();

    await VendorModel.updateOne(
      { _id: ObjectId(vendorId) },
      { $addToSet: { subscribers: id } }
    );

    return res
      .status(201)
      .json({ status: true, message: "subscribed successfully" });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################ DELETE SUBSCRIPTIONS BY VENDOR ID ##########################################
const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { vendorId } = req.params;
    await UserModel.updateOne(
      { _id: ObjectId(id) },
      { $pull: { subscriptions: { vendorId: vendorId } } }
    );
    await VendorModel.updateOne(
      { _id: ObjectId(vendorId) },
      { $pull: { subscribers: [id] } }
    );
    return res
      .status(200)
      .json({ status: true, message: "Unsubscribed to Vendor!" });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//################################ TOGGLE NOTIFICATION FOR A VENDOR ##########################################
const toggleNotification = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { vendorId, status } = req.query;

    await UserModel.updateOne(
      { _id: id, "subscriptions.vendorId": vendorId },
      {
        $set: {
          "subscriptions.$.showNotifications": status,
        },
      }
    );
    // console.log("subscriptions", subscriptions);
    return res.status(200).json({ status: true });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//################################ GET ALL SUBSCRIPTIONS DETAILS WITH PRODUCTS ##########################################
const getSubscribedVendors = async (req, res, next) => {
  try {
    const { id } = req.user;
    const userData = await UserModel.findById(id).select("subscriptions");

    if (!userData) {
      return next(createError(501, "No Subscriptions Found!"));
    }

    const promiseArr = userData.subscriptions.map((item) => {
      return new Promise((resolve, reject) => {
        try {
          VendorModel.findOne(
            { _id: item.vendorId },
            {
              name: 1,
              image: 1,
              subscribers: 1,
              ratingData: 1,
            }
          )
            .then((vendor) => {
              if (!vendor) {
                return reject({ message: "Vendor Not Found!" });
              }
              return vendor;
            })
            .then((vendor) => {
              ProductModel.find(
                { vendorId: item.vendorId, status: "active" },
                {
                  title: 1,
                  defaultImage: 1,
                  ratingData: 1,
                  defaultPrice: 1,
                  discount: 1,
                }
              )
                .sort({
                  createdAt: -1,
                })
                .limit(8)
                .lean()
                .then((products) => {
                  let { showNotifications } = item;

                  return resolve({
                    vendor: vendor,
                    products: products,
                    showNotifications: showNotifications,
                  });
                })
                .catch((err) => {
                  return reject({ message: "Product Not Found!" });
                });
            });
        } catch (error) {
          return reject(error.message);
        }
      });
    });

    const response = await Promise.allSettled(promiseArr);

    const vendors = response
      .filter((item) => item.status === "fulfilled")
      .map((data) => data.value);

    return res.status(200).json({ status: true, data: vendors });
  } catch (error) {
    return next(createError(501, error.message));
  }
}; 

module.exports = {
  subscribeVendor,
  getSubscribedVendors,
  deleteSubscription,
  toggleNotification,
};
