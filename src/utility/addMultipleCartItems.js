const { default: mongoose } = require("mongoose");
const ProductModel = require("../models/productModel");
const VendorModel = require("../models/vendorModel");

async function addMultipleCartItems(cart) {
  const promiseArray = cart.map((cartItem) => {
    return new Promise((resolve, reject) => {
      try {
        ProductModel.findOne({
          _id: mongoose.Types.ObjectId(cartItem.productId),
          status: "active",
        })
          .then((product) => {
            VendorModel.findById(mongoose.Types.ObjectId(product.vendorId))
              .then((vendor) => {
                return vendor.name;
              })
              .then((vendorName) => {
                const cartProduct = {
                  productId: product._id,
                  productName: product.title,
                  brand: product.brandName,
                  productImage: product?.defaultImage[0].thumbnailUrl,
                  vendorId: product.vendorId,
                  vendorName: vendorName,
                  price: product.price,
                  discount: product.discount,
                  quantity: cartItem.quantity,
                };
                return resolve(cartProduct);
              })
              .catch((err) => {
                return reject({ message: err.message });
              });
          })
          .catch((err) => {
            return reject({ message: err.message });
          });
      } catch (error) {
        return reject({ message: error.message });
      }
    });
  });

  const result = await Promise.all(promiseArray);
  return result;
}

module.exports = { addMultipleCartItems };
