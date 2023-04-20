const { validationResult } = require("express-validator");
const createError = require("http-errors");
const { ObjectId } = require("mongodb");
const orderModel = require("../../models/orderModel");
const productModel = require("../../models/productModel");
const vendorModel = require("../../models/vendorModel");
const { checkVendorExists } = require("../../utility/checkExistence");
const panVerifier = require("validate-india").pan;
const aadharVerifier = require("validate-india").aadhaar;
const ImageKit = require("imagekit");

//################################### Update Vendor Data #################################
const updateVendorData = async (req, res, next) => {
  try {
    console.log("here", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    let {
      name,
      storeName,
      address,
      city,
      aadharNumber,
      panNumber,
      aadharFrontImage,
      aadharFrontFileId,
      aadharBackImage,
      aadharBackFileId,
      panImage,
      panFileId,
      image,
      imageFileId,
      deliveryCharge,
    } = req.body;
    const { id } = req.user;
    let vendor = await vendorModel.findOne({ _id: id });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist!"));
    }
    //Check if Vendor is approved
    if (vendor.status === "approved") {
      return next(createError(406, "Details can't be changed once approved!"));
    }
    //Validate PAN Number
    // if (!panVerifier.isValid(panNumber)) {
    //   return next(createError(406, "Invalid PAN Number!"));
    // }
    //Validate Aadhar Number
    // if (!aadharVerifier.isValid(aadharNumber)) {
    //   return next(createError(406, "Invalid Aadhar Number!"));
    // }
    console.log("cp");
    await vendorModel.updateOne(
      { _id: id },
      {
        $set: {
          name: name,
          storeName: storeName,
          city: city,
          aadharNumber: aadharNumber,
          panNumber: panNumber,
          aadharFrontImage: aadharFrontImage,
          aadharFrontFileId: aadharFrontFileId,
          aadharBackImage: aadharBackImage,
          aadharBackFileId: aadharBackFileId,
          panImage: panImage,
          panFileId: panFileId,
          image: image,
          imageFileId: imageFileId,
          status: "pending",
          address: address,
          deliveryCharge: deliveryCharge,
        },
      }
    );
    return res
      .status(201)
      .json({ status: true, message: "Vendor Data Updated!" });
  } catch (e) {
    return next(createError(501, e.message));
  }
};

//################################### Get Vendor Data #################################
const getVendorData = async (req, res, next) => {
  try {
    const { id } = req.user;
    let vendor = await vendorModel.findOne({ _id: id }, { password: 0 });
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist"));
    }

    return res.status(201).json({ status: true, data: vendor });
  } catch (e) {
    return next(createError(501, e.message));
  }
};

//################################### Get Vendor Data #################################
const getVendorDashboardData = async (req, res, next) => {
  try {
    const { id } = req.user;
    console.log("id", id);
    let vendor = await checkVendorExists(id, "id");
    if (!vendor) {
      return next(createError(406, "Vendor Does Not Exist"));
    }

    //get Total Completed Orders Count and Total Revenue
    let orderData = await orderModel.aggregate([
      { $match: { vendorId: id, status: "delivered" } },
      {
        $group: {
          _id: "",
          totalRevenue: { $sum: "$netAmount" },
          orderCount: { $count: {} },
        },
      },
      { $project: { _id: 0 } },
    ]);
    let totalRevenue = 0;
    let completedOrdersCount = 0;
    if (orderData.length !== 0) {
      totalRevenue = orderData[0].totalRevenue;
      completedOrdersCount = orderData[0].orderCount;
    }
    let subscribersCount = vendor.subscribers.length;
    let pendingOrdersCount = await orderModel.countDocuments({
      vendorId: id,
      status: "pending",
    });
    let productsCount = await productModel.countDocuments({ vendorId: id });
    let products = await productModel
      .find({ vendorId: id })
      .sort({ createdAt: -1 })
      .limit(5);
    let orders = await orderModel
      .find({ vendorId: id })
      .sort({ createdAt: -1 })
      .limit(5);
    let { name, phone, status, reasonForRejection } = vendor;
    return res.status(201).json({
      status: true,
      data: {
        subscribersCount,
        pendingOrdersCount,
        productsCount,
        totalRevenue,
        completedOrdersCount,
      },
      vendorDetails: {
        name,
        phone,
        status,
        reasonForRejection,
      },
      products: products,
      orders: orders,
    });
  } catch (e) {
    return next(createError(501, e.message));
  }
};

//################################### Upload Image #################################
const uploadImage = async (req, res, next) => {
  try {
    console.log("req.body", req.body);
    var imagekit = new ImageKit({
      urlEndpoint: "https://ik.imagekit.io/d0ya7x2z5",
      publicKey: "public_dAB3TAf+wMny5xvNajS+y1RA29A=",
      privateKey: "private_x75v8XOM6fzqNz1z661glRJ7M9U=",
    });

    var base64Img = req.body.image;

    console.log("base64Img", base64Img);

    imagekit.upload(
      {
        file: base64Img,
        fileName: req.body.name,
        folder: "WEM/Products",
      },
      function (error, result) {
        if (error) {
          console.log("error.message", error.message);
          return res.json({
            message: error.message,
            status: false,
          });
        } else {
          console.log("Success");
          return res.json({
            message: result,
            status: true,
          });
        }
      }
    );
  } catch (e) {
    return next(createError(501, e.message));
  }
};

//################################### Upload Image #################################
const deleteImage = async (req, res, next) => {
  try {
    var imagekit = new ImageKit({
      urlEndpoint: "https://ik.imagekit.io/d0ya7x2z5",
      publicKey: "public_dAB3TAf+wMny5xvNajS+y1RA29A=",
      privateKey: "private_x75v8XOM6fzqNz1z661glRJ7M9U=",
    });

    imagekit.deleteFile(req.body.fileId, function (error, result) {
      if (error) {
        return res.json({
          message: error,
          status: false,
        });
      } else {
        return res.json({
          message: result,
          status: true,
        });
      }
    });
  } catch (e) {
    return next(createError(501, e.message));
  }
};

module.exports = {
  updateVendorData,
  getVendorData,
  getVendorDashboardData,
  uploadImage,
  deleteImage,
};
