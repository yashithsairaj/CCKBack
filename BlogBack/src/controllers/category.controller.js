import { Category } from "../models/category.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    const newCategory = new Category({
      name,
      categoryId,
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      id: savedCategory._id,
      name: savedCategory.name,
      categoryId: savedCategory.categoryId,
      createdAt: savedCategory.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating post", error });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.body._id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting category" });
  }
};

const fetchCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.body._id);
    if (!category) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({
      id: category._id,
      name: category.name,
      categoryId: category.categoryId,
      createdAt: category.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const fetchAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}); // Fetch all categories
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryId = req.body._id;

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      {
        name: req.body.name,
        categoryId: req.body.categoryId,
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const checkCategoryDuplicates = asyncHandler(async (req, res) => {
  const { name } = req.query;
  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }
    return res.status(200).json({ message: "Category is available" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export {
  createCategory,
  deleteCategory,
  fetchCategory,
  updateCategory,
  fetchAllCategories,
  checkCategoryDuplicates
};
