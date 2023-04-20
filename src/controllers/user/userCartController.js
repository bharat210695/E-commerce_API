const createError = require("http-errors");
const { validationResult } = require("express-validator");
const UserModel = require("../../models/userModel");
const ProductModel = require("../../models/productModel");
const VendorModel = require("../../models/vendorModel");
const { default: mongoose, Schema, Mongoose } = require("mongoose");
const userModel = require("../../models/userModel");
const cartModel = require("../../models/cartModel");
const productModel = require("../../models/productModel");
const ObjectId = mongoose.Types.ObjectId;

//################################ GET USER CART ##########################################
const getUserCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id } = req.user;

    let cart = await cartModel.find({ userId: mongoose.Types.ObjectId(id) });
    // if (!cart) {
    //   return res.status(200).json({
    //     status: true,
    //     data: {
    //       cart: cart,
    //     },
    //   });
    // }

    //map inside the cart array
    cart = cart?.map(async (item) => {
      let { userId, productId, qty, colorId, sizeId, productDetails } = item;
      //find the selected attribute/color
      let currentProduct = await productModel.findOne(
        {
          _id: ObjectId(item.productId),
        },
        {
          discount: 1,
          title: 1,
          status: 1,
          brandName: 1,
          attributes: {
            $elemMatch: {
              _id: ObjectId(item.colorId),
            },
          },
        }
      );
      //filter out the selected size
      let currentSize = currentProduct.attributes[0].sizes.filter(
        (size) => size._id.toString() === item.sizeId.toString()
      );
      //return the current price of product along with other cart details
      return {
        cartItemId: item._id,
        userId,
        productId,
        qty,
        colorId,
        sizeId,
        productDetails,
        discount: currentProduct.discount,
        price: currentSize[0].price,
      };
    });
    let cartArray = await Promise.all(cart);
    return res.status(200).json({
      status: true,
      data: {
        cart: cartArray,
      },
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################ ADD/ICREASE TO CART ##########################################
const addToCart = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id } = req.user;
    const { productId, colorId, sizeId } = req.body;
    // colorId = attributes array id
    const product = await ProductModel.findOne(
      {
        _id: ObjectId(productId),
      },
      {
        vendorId:1,
        title: 1,
        status: 1,
        brandName: 1,
        attributes: {
          $elemMatch: {
            _id: ObjectId(colorId),
          },
        },
      }
    ).lean();

    if (
      !product ||
      !product.attributes?.length ||
      product.status !== "active"
    ) {
      return next(createError(404, "Product Not Found!"));
    }
    let color = product.attributes[0];

    if (color._id.toString() === colorId.toString()) {
      for (let index = 0; index < color.sizes.length; index++) {
        if (
          color.sizes[index]._id.toString() === sizeId.toString() &&
          color.sizes[index].qty > 0
        ) {
          let productDetails = {
            title: product.title,
            brandName: product.brandName,
            size: color.sizes[index].size,
            colorCode: color.colorCode,
            color: color.color,
            image: color.images[0].thumbnailUrl,
          };
          await cartModel.create({
            vendorId: product.vendorId,
            productId: productId,
            colorId: colorId,
            sizeId: sizeId,
            userId: id,
            qty: 1,
            productDetails,
          });
          return res
            .status(200)
            .json({ status: true, message: "Added to Cart!" });
        }
      }
    }

    return next(createError(404, "Product Out of Stock!"));
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################ DECREMENT/REMOVE FROM CART ##########################################
const updateCartItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id } = req.user;
    const { type, cartItemId } = req.body;

    //check if cart exists
    let cartItem = await cartModel.findOne({ _id: cartItemId });
    if (!cartItem) {
      return next(createError(406, "Cart Item Does not Exist!"));
    }
    //if user is decrementing quantity
    if (type === "dec") {
      if (cartItem.qty === 1) {
        await cartModel.deleteOne({ _id: cartItemId });
      } else {
        await cartModel.updateOne({ _id: cartItemId }, { $inc: { qty: -1 } });
      }
      return res
        .status(200)
        .json({ status: true, message: "Removed From Cart!" });
    }

    //find product with selected attribute/color
    const product = await ProductModel.findOne(
      {
        _id: ObjectId(cartItem.productId),
      },
      {
        title: 1,
        status: 1,
        attributes: {
          $elemMatch: {
            _id: ObjectId(cartItem.colorId),
          },
        },
      }
    ).lean();

    //if no product, return product not found message
    if (
      !product ||
      !product.attributes?.length ||
      product.status !== "active"
    ) {
      return next(createError(404, "Product Not Found!"));
    }

    let color = product.attributes[0];

    if (color._id.toString() === cartItem.colorId.toString()) {
      for (let index = 0; index < color.sizes.length; index++) {
        if (
          color.sizes[index]._id.toString() === cartItem.sizeId.toString() &&
          color.sizes[index].qty > 0
        ) {
          await cartModel.updateOne({ _id: cartItemId }, { $inc: { qty: 1 } });

          return res
            .status(200)
            .json({ status: true, message: "Added to Cart!" });
        }
      }
    }

    return next(createError(404, "Product Out of Stock!"));
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################ REMOVE AN ITEM FROM CART ##########################################
const removeCartItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id } = req.user;
    const { cartItemId } = req.params;
    let removeCart = await cartModel.deleteOne({ _id: cartItemId, userId: id });
    if (removeCart.deletedCount === 0) {
      return next(createError(406, "Some Error Occured!"));
    }
    return res.status(200).json({ status: true, message: "Item Removed!" });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//################################ ADD MULTIPLE CART ITEMS ##########################################
const addMultipleCartItems = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { id } = req.user;
    const { cart } = req.body;
    // function addItem(cartItem) {
    //   return new Promise((resolve, reject) => {
    //     ProductModel.findOne({
    //       _id: mongoose.Types.ObjectId(cartItem.productId),
    //       status: "active",
    //     })
    //       .then((res) => {
    //         UserModel.findOne({
    //           _id: mongoose.Types.ObjectId(id),
    //         })
    //           .then((user) => {})
    //           .catch((err) => {});

    //         user.cart = newCart;
    //         user.save();
    //       })
    //       .catch((err) => reject("The product is not avaiable "));
    //     if (!product) {
    //       return next(createError(404, "product not found!"));
    //     }
    //   });
    // }
    cart.map(async (item) => {
      let { productId, qty, colorId, sizeId, productDetails } = item;
      let product = await productModel.findOne({ _id: productId });
      let cartObject = {
        userId: mongoose.Types.ObjectId(id),
        vendorId: mongoose.Types.ObjectId(product.vendorId),
        productId: mongoose.Types.ObjectId(productId),
        colorId: mongoose.Types.ObjectId(colorId),
        sizeId: mongoose.Types.ObjectId(sizeId),
        productDetails: productDetails,
        qty: qty,
      };
      await cartModel.create(cartObject);
    });
    return res.status(200).json({ status: true, message: "Cart Added!" });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

module.exports = {
  addToCart,
  updateCartItem,
  getUserCart,
  addMultipleCartItems,
  removeCartItem,
};
