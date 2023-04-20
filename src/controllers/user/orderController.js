const { validationResult } = require("express-validator");
const createError = require("http-errors");
const { default: mongoose, mongo } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const VendorModel = require("../../models/vendorModel");
const OrderModel = require("../../models/orderModel");
const ProductModel = require("../../models/productModel");
const UserModel = require("../../models/userModel");
const DeliveryPartnerModel = require("../../models/deliveryPartnerModel");
const { checkUserExists } = require("../../utility/checkExistence");
const { generateOTP } = require("../../utility/generateOTP");
const orderModel = require("../../models/orderModel");
const productModel = require("../../models/productModel");
const cartModel = require("../../models/cartModel");
const externalDataModel = require("../../models/externalDataModel");
const vendorModel = require("../../models/vendorModel");
const userModel = require("../../models/userModel");
const reviewModel = require("../../models/reviewModel");

// ######################## PLACE ORDER ##############################
const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return res.status(400).json({ message: errorMessage });
    }
    let { id } = req.user;
    let user = await checkUserExists(id, "id");

    if (!user) {
      return next(createError(404, "User Does Not Exist"));
    }
    const { deliveryPartnerId, deliveryType } = req.body;

    //Default Address Data Being Fetched
    let defaultAddressData = user.addresses.filter((address) => {
      let { _id } = address;
      return String(_id) === user.defaultAddress.toString();
    });

    console.log("defaultAddressData", defaultAddressData);

    //City To Where the Order will be delivered.
    let cityTo = defaultAddressData[0].city;

    console.log("cityTo", cityTo);

    //create Order ID for all the product Orders.
    const orderId = mongoose.Types.ObjectId();

    //Fetch User Cart
    let cart = await cartModel.find({ userId: id }).lean();

    console.log("cart", cart);

    //create a vendor group from all the products in the cart
    const vendorGroup = cart.reduce((group, item) => {
      const { vendorId } = item;
      group[vendorId] = group[vendorId] ?? [];
      group[vendorId].push(item);
      return group;
    }, {});

    console.log("vendorGroup", vendorGroup);

    //If delivery Type is agent
    if (deliveryType === "agent") {
      //fetch delivery partner data
      const deliveryPartner = await DeliveryPartnerModel.findById(
        ObjectId(deliveryPartnerId),
        { _id: 0, charges: 1 }
      );

      console.log("deliveryPartner", deliveryPartner);

      const objArr = [];

      // set delivery fees and delivery days object
      for (const key in vendorGroup) {
        let i = 0;
        let deliveryFee = 0;
        let deliveryDays = 0;
        for (const item of vendorGroup[key]) {
          if (i === 0) {
            const vendor = await VendorModel.findById(ObjectId(item.vendorId), {
              address: 1,
            });
            const chargeObj = deliveryPartner.charges.find(
              (item) =>
                item.shipFrom === vendor.address.city && item.shipTo === cityTo
            );
            if (!chargeObj) {
              return next(
                createError(
                  404,
                  "Delivery Partner Unable to Complete this Order!"
                )
              );
            }
            deliveryFee = chargeObj.charge / vendorGroup[key].length;
            deliveryDays = chargeObj.days;
            objArr.push({ ...item, deliveryFee, deliveryDays });
            i++;
          } else {
            objArr.push({ ...item, deliveryFee, deliveryDays });
          }
        }
        i = 0;
      }

      console.log("objArr", objArr);

      if (objArr.length === 0) {
        return next(createError(404, "Some Error Occured!"));
      }

      // create order data
      const promiseArr = objArr.map((item) => {
        return new Promise(async (resolve, reject) => {
          try {
            const product = await ProductModel.aggregate([
              {
                $match: {
                  _id: item.productId,
                },
              },
              {
                $project: {
                  title: 1,
                  categoryId: 1,
                  subCategoryId: 1,
                  discount: 1,
                  vendorId: 1,
                  attributes: 1,
                },
              },
              {
                $unwind: {
                  path: "$attributes",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $match: {
                  "attributes.color": item.productDetails.color,
                },
              },
              {
                $unwind: {
                  path: "$attributes.sizes",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $match: {
                  "attributes.sizes.size": item.productDetails.size,
                },
              },
              {
                $limit: 1,
              },
            ]);

            console.log("product here", product);

            if (!product || product.length === 0) {
              return reject("Product not found");
            }
            // const customer = await UserModel.findOne(
            //   { _id: id },
            //   {
            //     name: 1,
            //     email: 1,
            //     phone: 1,
            //     addresses: {
            //       $elemMatch: { _id: ObjectId(user.defaultAddress) },
            //     },
            //   }
            // );
            // if (!customer) {
            //   reject("Customer Not Found");
            // }
            console.log("hereeee 1");
            console.log("item", item);
            console.log("product", product);
            const vendorDetails = await vendorModel.findOne(
              {
                _id: item.vendorId,
              },
              { storeName: 1, address: 1 }
            );
            const orderObj = {
              orderId: orderId,
              vendorId: item.vendorId,
              vendorName: vendorDetails.storeName,
              customerName: user.name,
              customerEmail: user.email,
              customerId: user._id,
              customerPhoneNo: user.phone,
              customerAddress: defaultAddressData[0],
              vendorAddress: vendorDetails.address,
              customerOtp: generateOTP(),
              productId: item.productId,
              product: product[0],
              deliveryPartnerId: deliveryPartnerId,
              deliveryType: "agent",
              deliveryFee: item.deliveryFee,
              deliveryPartnerOtp: generateOTP(),
              daysForDelivery: item.deliveryDays,
              qty: item.qty,
              price: product[0].attributes.sizes.price,
              discount: product[0].discount,
              totalPrice:
                (product[0].attributes.sizes.price - product[0].discount) *
                item.qty,

              netAmount:
                (product[0].attributes.sizes.price - product[0].discount) *
                  item.qty +
                item.deliveryFee,
              paymentMode: "cod",
              gstAmount: 0,
            };

            return resolve(orderObj);
          } catch (error) {
            return reject(error.message);
          }
        });
      });
      const orderData = await Promise.all(promiseArr);

      console.log("orderData", orderData);

      //insert multiple orders (one for each product)
      OrderModel.insertMany(orderData)
        .then(async () => {
          let updateCounter = await DeliveryPartnerModel.updateOne(
            { _id: deliveryPartnerId },
            {
              $inc: {
                pendingDeliveries: cart.length,
              },
            }
          );

          if (updateCounter.modifiedCount === 0) {
            return next(
              createError(500, "Error Occured While Updating Delivery Partner!")
            );
          }
          console.log("Order Placed!");
        })
        .catch((err) => {
          console.log("err.message", err.message);
          return next(createError(500, err.message));
        });
    } else {
      const objArr = [];

      // set delivery fees and delivery days object
      for (const key in vendorGroup) {
        let i = 0;
        let deliveryFee = 0;
        let deliveryDays = 0;
        for (const item of vendorGroup[key]) {
          if (i === 0) {
            const vendor = await VendorModel.findById(ObjectId(item.vendorId), {
              deliveryCharge: 1,
            });

            deliveryFee = vendor.deliveryCharge / vendorGroup[key].length;
            deliveryDays = null;
            objArr.push({ ...item, deliveryFee, deliveryDays });
            i++;
          } else {
            objArr.push({ ...item, deliveryFee, deliveryDays });
          }
        }
        i = 0;
      }

      console.log("objArr", objArr);

      if (objArr.length === 0) {
        return next(createError(404, "Some Error Occured!"));
      }

      // create order data
      const promiseArr = objArr.map((item) => {
        return new Promise(async (resolve, reject) => {
          try {
            const product = await ProductModel.aggregate([
              {
                $match: {
                  _id: item.productId,
                },
              },
              {
                $project: {
                  title: 1,
                  categoryId: 1,
                  subCategoryId: 1,
                  discount: 1,
                  vendorId: 1,
                  attributes: 1,
                },
              },
              {
                $unwind: {
                  path: "$attributes",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $match: {
                  "attributes.color": item.productDetails.color,
                },
              },
              {
                $unwind: {
                  path: "$attributes.sizes",
                  preserveNullAndEmptyArrays: false,
                },
              },
              {
                $match: {
                  "attributes.sizes.size": item.productDetails.size,
                },
              },
              {
                $limit: 1,
              },
            ]);

            console.log("product here", product);

            if (!product || product.length === 0) {
              return reject("Product not found");
            }
            // const customer = await UserModel.findOne(
            //   { _id: id },
            //   {
            //     name: 1,
            //     email: 1,
            //     phone: 1,
            //     addresses: {
            //       $elemMatch: { _id: ObjectId(user.defaultAddress) },
            //     },
            //   }
            // );
            // if (!customer) {
            //   reject("Customer Not Found");
            // }

            const vendorDetails = await vendorModel.findOne(
              {
                _id: item.vendorId,
              },
              { storeName: 1, address: 1 }
            );
            const orderObj = {
              orderId: orderId,
              vendorId: item.vendorId,
              vendorName: vendorDetails.storeName,
              customerName: user.name,
              customerEmail: user.email,
              customerId: user._id,
              customerPhoneNo: user.phone,
              customerAddress: defaultAddressData[0],
              vendorAddress: vendorDetails.address,
              customerOtp: "",
              productId: item.productId,
              product: product[0],
              deliveryPartnerId: "",
              deliveryType: "courier",
              deliveryFee: item.deliveryFee,
              deliveryPartnerOtp: "",
              daysForDelivery: item.deliveryDays,
              qty: item.qty,
              price: product[0].attributes.sizes.price,
              discount: product[0].discount,
              totalPrice:
                (product[0].attributes.sizes.price - product[0].discount) *
                item.qty,

              netAmount:
                (product[0].attributes.sizes.price - product[0].discount) *
                  item.qty +
                item.deliveryFee,
              paymentMode: "online",
              gstAmount: 0,
            };

            return resolve(orderObj);
          } catch (error) {
            return reject(error.message);
          }
        });
      });
      const orderData = await Promise.all(promiseArr);

      console.log("orderData", orderData);

      //insert multiple orders (one for each product)
      OrderModel.insertMany(orderData)
        .then(() => {
          console.log("Order Placed");
        })
        .catch((err) => {
          return next(createError(500, err.message));
        });
    }
    let deleteCart = await cartModel.deleteMany({ userId: id });

    if (deleteCart.deletedCount === 0) {
      return next(
        createError(500, "Order Placed ! Error Occured While Clearing Cart!")
      );
    }
    return res.status(201).json({
      status: true,
      message: "Order has been Placed!",
      orderId,
    });
  } catch (e) {
    console.log("e.message", e.message);
    return next(createError(500, e.message));
  }
};

// ######################## GET DELIVERY CHARGE ##############################
const getDeliveryCharge = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { id } = req.user;
    const { cityTo } = req.query;
    const customer = await UserModel.findOne(
      { id: id },
      {
        cart: 1,
      }
    );

    if (!customer) {
      return next(createError(404, "Customer not found!"));
    }
    console.log("cp2");

    let cart = await cartModel.find({ userId: id });
    if (cart.length === 0) {
      return next(createError(404, "Cart Empty!"));
    }

    const vendorArr = []; // [{_id,city},{_id,city}......]
    let vendorCityArr = []; //[string,string,string]

    const promiseArr = cart.map((cartItem) => {
      return new Promise((resolve, reject) => {
        //find product
        ProductModel.findById(ObjectId(cartItem.productId), {
          vendorId: 1,
        })
          .then((product) => {
            //find vendor of the product
            return VendorModel.findById(ObjectId(product.vendorId), {
              address: 1,
            }).lean();
          })
          .then((vendor) => {
            console.log("vendor", vendor);
            //push vendor city into vendorCityArr array
            vendorCityArr.push(vendor.address.city); //storing vendor city
            //push vendor city and id into vendorArr array
            vendorArr.push({
              id: vendor._id.toString(),
              city: vendor.address.city,
            });

            resolve({
              productId: cartItem.productId,
              quantity: cartItem.quantity,
              vendorId: vendor._id,
              vendorCity: vendor.address.city,
              customerCity: cityTo,
            });
          })
          .catch((err) => {
            reject(err);
          });
      });
    });
    const promiseData = await Promise.all(promiseArr);
    console.log("cp4");

    //finding the unique vendors for finding delivery charge
    const vendorArrData = Array.from(
      new Set(vendorArr.map((item) => item.id))
    ).map((id) => {
      return {
        _id: id,
        city: vendorArr.find((vendor) => vendor.id === id).city,
      };
    });

    console.log("cp5");

    let cityInWemRange = await externalDataModel.findOne(
      {
        title: "available_cities",
      },
      {
        data: { $elemMatch: { city: cityTo } },
      }
    );
    console.log("cityInWemRange", cityInWemRange);
    //If user city is not among available cities
    if (cityInWemRange.data.length === 0) {
      let deliveryFee = 0;
      await Promise.all(
        vendorArrData.map(async (vendor) => {
          let vendorData = await vendorModel.findOne({
            _id: vendor._id,
            status: "approved",
          });
          deliveryFee = deliveryFee + vendorData.deliveryCharge;
        })
      );
      return res.status(200).json({
        deliveryPartnerId: "",
        status: true,
        totalDeliveryCharge: deliveryFee,
        chargeArr: [],
        promiseData: [],
      });
    }

    //array of all cities involved in the order(vendors city and customer city)
    let allCityArr = [...vendorCityArr, cityTo]; //[vendor cities and customer city]
    //distinct/unique cities from allCityArr
    let cityUniquArr = [...new Set(allCityArr)];

    //get couriers with least completed deliveries and active in all required cities
    const couriers = await DeliveryPartnerModel.findOne(
      {
        disabled: false,
        cities: { $all: cityUniquArr }, // [unique vendor cities and customer city]
      },
      { charges: 1 }
    ).sort({ completedDeliveries: 1 }); // ascending order

    if (!couriers) {
      return next(createError(404, "Delivery Not Possible!"));
    }

    let chargeArr = []; //store the matching customer city and vendor city items
    console.log("couriers", couriers);
    vendorArrData.map((vendor) => {
      const charge = couriers.charges.find(
        (item) => item.shipFrom === vendor.city && item.shipTo === cityTo
      );
      chargeArr.push(charge);
    });
    console.log("chargeArr", chargeArr);
    const totalDeliveryCharge = chargeArr.reduce((accum, currentItem) => {
      console.log("currentItem", currentItem);
      return accum + currentItem.charge;
    }, 0);
    console.log("totalDeliveryCharge", totalDeliveryCharge);
    return res.status(200).json({
      status: true,
      deliveryPartnerId: couriers._id,
      totalDeliveryCharge,
      chargeArr,
      promiseData,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// ######################## GET CUSTOMER ORDERS ##############################
const getOrders = async (req, res, next) => {
  try {
    const { id } = req.user;
    let { limit, page, sortField, sortValue, status, returnStatus } = req.query;

    //create filter object
    let filterObject = { customerId: id };

    //if status exists, add status filter
    if (status) {
      filterObject.status = status;
    }
    //if return status exists, add  return status filter
    if (returnStatus) {
      filterObject.returnStatus = returnStatus;
    }

    //pagination code
    if (!page) page = 1;
    if (!limit) limit = 10;
    const skip = (page - 1) * limit;

    //create sort object
    let sortObject = {};

    //if sort field and sort value exists, insert in sort object
    if (sortField && sortValue) {
      sortObject[sortField] = sortValue;
    }

    const orders = await OrderModel.find(filterObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limit);
    if (!orders) {
      return next(createError(404, "No orders found!"));
    }
    return res
      .status(200)
      .json({ data: { count: orders.length, orders }, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// ######################## GET ORDER DETAILS ##############################
const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { orderId } = req.params;
    console.log("id,orderId", id, orderId);
    let order = await orderModel.findOne({
      _id: orderId,
      // customerId: id.toString(),
    });
    console.log("order", order);
    if (!order) {
      return next(createError(500, "No order Found!"));
    }
    let review = await reviewModel.findOne({ orderId: orderId });
    return res.status(200).json({ data: order, status: true, review: review });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// ######################## CANCEL ORDER ##############################
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { orderId } = req.params;
    let updateOrder = await orderModel.updateOne(
      {
        customerId: id,
        _id: ObjectId(orderId),
        status: "pending",
      },
      {
        $set: {
          status: "cancelled",
          cancelledBy: "user",
        },
      }
    );
    if (updateOrder.modifiedCount === 0) {
      return next(createError(500, "Some Error Occured!"));
    }
    return res
      .status(200)
      .json({ message: "Order Has been Cancelled!", status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// ######################## RETURN ORDER ##############################
const returnOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    const { id } = req.user;
    const { orderId, reason } = req.body;
    let order = await orderModel.findOne({ _id: orderId });
    let product = await productModel.findOne({ _id: order.productId });
    //check if product in the order is returnable
    if (!product.allowReturn) {
      return next(createError(500, "This Product cannot be returned!"));
    }
    if (order.returnStatus === "rejected") {
      return next(createError(500, "Request Denied!"));
    }
    // Update order status, regenerate customer and delivery partner otp
    // and also set return status to pending
    let updateOrder = await orderModel.updateOne(
      {
        customerId: id,
        _id: orderId,
        status: "delivered",
        returnStatus: "",
      },
      {
        $set: {
          status: "return-request",
          returnStatus: "pending",
          // customerOtp: generateOTP(),
          // deliveryPartnerOtp: generateOTP(),
          reasonForReturnRequest: reason,
        },
      }
    );
    if (updateOrder.modifiedCount === 0) {
      return next(createError(500, "Some Error Occured!"));
    }
    return res
      .status(200)
      .json({ message: "Return Request has been sent!", status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

// ######################## REVIEW ORDER ##############################
const reviewOrder = async (req, res, next) => {
  try {
    console.log("review order");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }
    let { rating, review, orderId } = req.body;
    rating = Number(rating);

    console.log("rating,review,orderId", rating, review, orderId);
    let { id } = req.user;
    if (!review) {
      review = "";
    }
    let user = await userModel.findOne({ _id: id });
    if (!user) {
      return next(createError(406, "User Does Not Exist"));
    }
    let order = await orderModel.findOne({
      _id: orderId,
      status: { $in: ["delivered", "return-request"] },
    });
    if (!order) {
      return next(createError(406, "Order Does Not Exist"));
    }
    let product = await productModel.findOne({ _id: order.productId });
    if (!product) {
      return next(
        createError(406, "Unexpected Error! Product Does Not Exist!")
      );
    }
    let vendor = await vendorModel.findOne({ _id: order.vendorId });
    if (!vendor) {
      return next(createError(406, "Unexpected Error! Vendor Does Not Exist!"));
    }
    let reviewObject = {
      userId: user._id,
      username: user.name,
      productId: order.productId,
      orderId: orderId,
      vendorId: order.vendorId,
      rating: rating,
      review: review,
    };

    console.log("reviewObject", reviewObject);

    await reviewModel.create(reviewObject);

    // calculate new product rating data
    let newProductRatingData = {
      rating: product.ratingData.rating + rating,
      count: product.ratingData.count + 1,
    };

    //calculate new product rating
    let newProductRating =
      newProductRatingData.rating / newProductRatingData.count;

    // calculate new vendor rating data
    let newVendorRatingData = {
      rating: vendor.ratingData.rating + rating,
      count: vendor.ratingData.count + 1,
    };

    //calculate new vendor rating
    let newVendorRating =
      newVendorRatingData.rating / newVendorRatingData.count;

    console.log(
      "newProductRatingData, newProductRating,newVendorRatingData,newVendorRating",
      newProductRatingData,
      newProductRating,
      newVendorRatingData,
      newVendorRating
    );

    //update product rating data and rating
    let updateProductRating = await productModel.updateOne(
      { _id: order.productId },
      {
        $set: {
          ratingData: newProductRatingData,
          rating: newProductRating,
        },
      }
    );

    if (updateProductRating.modifiedCount === 0) {
      return next(createError(500, "Error While Adding Product Rating!"));
    }

    //update vendor rating data and rating
    let updateVendorRating = await vendorModel.updateOne(
      { _id: order.vendorId },
      {
        $set: {
          ratingData: newVendorRatingData,
          rating: newVendorRating,
        },
      }
    );

    if (updateVendorRating.modifiedCount === 0) {
      return next(createError(500, "Error While Adding Vendor Rating!"));
    }

    return res.status(200).json({ messsage: "Review Added!", status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

module.exports = {
  createOrder,
  getDeliveryCharge,
  getOrders,
  getOrderDetails,
  cancelOrder,
  returnOrder,
  reviewOrder,
};
