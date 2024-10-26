import { asyncHandler } from "../utils/asyncHandler.js";
import { Post } from "../models/post.model.js";
import mongoose from "mongoose";
import { Category } from "../models/category.model.js";

// Create Post
const createPost = asyncHandler(async (req, res) => {
  try {
    const { title, content, categoryId, authorId, thumbnail, description } =
      req.body; // Add thumbnail

    // Create a new post
    const newPost = new Post({
      title,
      content,
      categoryId,
      authorId,
      thumbnail, // Store base64 thumbnail image
      description,
    });

    const savedPost = await newPost.save();
    console.log(savedPost);

    res.status(201).json({
      id: savedPost._id,
      title: savedPost.title,
      content: savedPost.content,
      authorId: savedPost.authorId,
      categoryId: savedPost.categoryId,
      thumbnail: savedPost.thumbnail, // Return the thumbnail
      description: savedPost.description,
      createdAt: savedPost.createdAt,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating post", error });
  }
});

// Delete Post
const deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting post" });
  }
};

// Fetch Post by ID
const fetchPost = asyncHandler(async (req, res) => {
  try {
    const post = await Post.findById(req.query._id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Increment the view count
    post.views += 1;
    await post.save();

    res.status(200).json({
      id: post._id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      categoryId: post.categoryId,
      thumbnail: post.thumbnail, // Send the thumbnail
      description: post.description,
      createdAt: post.createdAt,
      views: post.views, // Return views count
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update Post
const updatePost = asyncHandler(async (req, res) => {
  try {
    const postId = req.body._id;
    console.log("Post ID received:", postId); // Check if postId is received

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        title: req.body.title,
        content: req.body.content,
        categoryId: req.body.categoryId,
        authorId: req.body.authorId,
        thumbnail: req.body.thumbnail, // Update the base64 thumbnail
        description: req.body.description,
      },
      { new: true, runValidators: true } // Return the updated post and run validation
    );

    if (!updatedPost) {
      console.log("Post not found");
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch all posts with pagination
const fetchAllPost = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 5; // Default to 5 posts per page

    if (!page || isNaN(page)) {
      return res.status(400).json({ message: "Invalid page number" });
    }

    const startIndex = (page - 1) * limit;
    const totalPosts = await Post.countDocuments(); // Get total number of posts

    // Fetch posts with pagination, sorted by createdAt in descending order
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // Sort by most recent
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      totalPosts, // Total number of posts
      currentPage: page, // Current page
      totalPages: Math.ceil(totalPosts / limit), // Total pages
      posts, // List of posts
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Search Post by keyword with a limit for suggestions
const searchPost = asyncHandler(async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const limit = parseInt(req.query.limit) || 5; // Limit results to 5

    const posts = await Post.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ],
    }).limit(limit); // Limit the number of results

    if (posts.length === 0) {
      return res.status(200).json({ message: "No posts found", posts: [] });
    }

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch Posts by Category
const fetchPostsByCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.query.categoryId);

    // Check if categoryId is valid
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    const categoryExists = await Category.findOne({ categoryId });
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const posts = await Post.find({ categoryId });

    if (!posts.length) {
      return res
        .status(200)
        .json({ message: "No posts found for this category" });
    }

    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchTrendingPosts = asyncHandler(async (req, res) => {
  try {
    const trendingPosts = await Post.find().sort({ views: -1 }).limit(5);
    res.status(200).json(trendingPosts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trending posts", error });
  }
});

// Increment click count for a category
const incrementCategoryClick = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Increment the clickCount by 1 for the given category
    const category = await Category.findOneAndUpdate(
      { categoryId: categoryId },
      { $inc: { clickCount: 1 } }, // Increment clickCount
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category click count updated", category });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating category click count", error });
  }
});

const fetchTrendingCategories = asyncHandler(async (req, res) => {
  try {
    const trendingCategories = await Category.find()
      .sort({ clickCount: -1 }) // Sort by clickCount in descending order
      .limit(5); // Limit to top 5 categories

    res.status(200).json(trendingCategories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trending categories", error });
  }
});

const checkDuplicates = asyncHandler(async (req, res) => {
  const { title } = req.query;
  try {
    const existingPost = await Post.findOne({ title });
    if (existingPost) {
      return res.status(400).json({ message: "Title already exists" });
    }
    return res.status(200).json({ message: "Title is available" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

export {
  createPost,
  deletePost,
  fetchPost,
  updatePost,
  fetchAllPost,
  searchPost,
  fetchPostsByCategory,
  fetchTrendingCategories,
  fetchTrendingPosts,
  incrementCategoryClick,
  checkDuplicates
};
