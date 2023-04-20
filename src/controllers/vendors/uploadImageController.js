const createError = require("http-errors");
const ImageKit = require("imagekit");
var fs = require("fs");
exports.uploadImage = async (req, res, next) => {
  try {
    const { images } = req.body;

    var imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });

    let uploadArray = [];
    uploadArray = images.map((image, i) => {
      return new Promise((resolve, reject) => {
        imagekit.upload(
          {
            file: image.base64, //required
            fileName: image.fileName, //required
            tags: ["tag1", "tag2"],
          },
          function (error, result) {
            if (error) {
              console.log(`error ${i}`, error);
              return reject(error);
            } else {
              console.log(`result ${i}`, result);
              resolve(result);
            }
          }
        );
      });
    });

    Promise.all(uploadArray)
      .then((result) => {
        console.log("Promise all res", result);
        const imageArray = result.map((item) => {
          return { fileId: item.fileId, url: item.url };
        });
        return res
          .status(200)
          .json({ message: "success", images: imageArray, status: true });
      })
      .catch((err) => {
        console.log("Promise all catch err", err);
        return next(createError(500, err.message));
      });
  } catch (error) {
    return next(createError(500, error.message));
  }
};
