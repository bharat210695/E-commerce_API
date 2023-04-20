const createError = require("http-errors");
const AdminModel = require("../../models/adminModel");
const ProductModel = require("../../models/productModel");
const categoryModel = require("../../models/categoryModel");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

//########################### ADD NEW CATEGORY ##############################
const addNewCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { category } = req.body;

    const doesCatggoryExists = await categoryModel.findOne({
      category: category,
    });

    if (doesCatggoryExists) {
      return next(createError(406, `${category} already Exists!`));
    }

    await categoryModel.create({ category: category });

    return res.status(201).json({
      status: true,
      message: "Success",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//########################### GET ALL CATEGORIES ##############################
const getCategories = async (req, res, next) => {
  try {
    let { page, limit } = req.body;
    if (!limit || limit <= 0) limit = 10;
    if (!page || page <= 0) page = 1;
    const skip = (page - 1) * limit;

    const categories = await categoryModel
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.status(200).json({ data: categories, status: true });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### GET CATEGORY BY TITLE ##############################
// const getCategoryByTitle = async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return next(createError(406, errors.array()[0].msg));
//     }

//     const { category } = req.params;

//     const findCategory = await categoryModel.findOne({
//       category: category,
//     });
//     return res
//       .status(200)
//       .json({ data: findCategory ? findCategory : [], status: true });
//   } catch (error) {
//     return next(createError(500, error.message));
//   }
// };

//########################### UPDATE CATEGORY BY ID  ##############################
const updateCategoryById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError(406, errors.array()[0].msg));
    }

    const { categoryId, category } = req.body;

    const categoryObj = await categoryModel.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(categoryId) },
      { category: category },
      { new: true }
    );

    if (!categoryObj) {
      return next(createError(500, "Some Error Occured!"));
    }

    return res.status(200).json({
      message: "Category Updated Successfully!",
      status: true,
    });
  } catch (error) {
    return next(createError(500, error.message));
  }
};

//########################### DELETE CATEGORY ##############################
const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const doesProductExists = await ProductModel.findOne({
      categoryId: categoryId.toString(),
    });

    if (doesProductExists) {
      return next(
        createError(406, "Category already in use in product! Cannot Delete!")
      );
    }
    const result = await categoryModel.findByIdAndDelete(
      mongoose.Types.ObjectId(categoryId)
    );
    if (!result) {
      return next(createError(400, "Some Error Occured!"));
    }
    return res.status(201).json({
      status: true,
      message: "Category Deleted Succesfully!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//########################### ADD NEW Sub CATEGORY ##############################
const addNewSubCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }

    const { categoryId, subCategory } = req.body;

    const parentCategory = await categoryModel.findById(
      mongoose.Types.ObjectId(categoryId)
    );
    if (!parentCategory) {
      return next(createError(404, "Category Does not Exist!"));
    }

    const updatedCategory = await categoryModel.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(categoryId),
        "subCategories.subCategory": { $ne: subCategory },
      },
      {
        $push: {
          subCategories: { subCategory, parent: parentCategory.category },
        },
      },
      { new: true }
    );
    if (!updatedCategory) {
      return next(createError(406, `${subCategory} Already Exists!`));
    }

    return res.status(201).json({
      status: true,
      message: "Sub Category Added!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//########################### UPDATE SUB CATEGORY ##############################
const updateSubCategory = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array()[0].msg;
      return next(createError(406, errorMessage));
    }
    const { categoryId, subCategory, subCategoryId } = req.body;

    const doesSubCategoryExists = await categoryModel.findOne({
      _id: mongoose.Types.ObjectId(categoryId),
      "subCategories.subCategory": subCategory,
    });

    if (doesSubCategoryExists) {
      return next(createError(406, `${subCategory} Already Exists!`));
    }

    const updatedCategory = await categoryModel.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId(categoryId),
        "subCategories._id": mongoose.Types.ObjectId(subCategoryId),
      },
      {
        $set: {
          "subCategories.$.subCategory": subCategory,
        },
      },
      { new: true }
    );
    if (!updatedCategory) {
      return next(createError(406, "Some Error Occured!"));
    }

    return res.status(201).json({
      status: true,
      message: "SubCategory Updated!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

//########################### DELETE SUB CATEGORY ##############################
const deleteSubCategory = async (req, res, next) => {
  try {
    const { categoryId, subCategoryId } = req.params;

    const doesProductExists = await ProductModel.findOne({
      subCategoryId: subCategoryId.toString(),
    });

    if (doesProductExists) {
      return next(createError(406, "category is already in use"));
    }

    let deleteSubCategory = await categoryModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(categoryId),
      },
      {
        $pull: {
          subCategories: {
            _id: mongoose.Types.ObjectId(subCategoryId),
          },
        },
      }
    );
    if (deleteSubCategory.modifiedCount === 0) {
      return next(createError(501, "Some Error Occured!"));
    }

    return res.status(201).json({
      status: true,
      message: "Sub Category Deleted!",
    });
  } catch (error) {
    return next(createError(501, error.message));
  }
};

module.exports = {
  getCategories,
  // getCategoryByTitle,
  updateCategoryById,
  addNewCategory,
  deleteCategory,
  addNewSubCategory,
  updateSubCategory,
  deleteSubCategory,
};
