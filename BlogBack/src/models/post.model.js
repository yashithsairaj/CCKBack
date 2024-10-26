import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    categoryId: {
      type: Number,
      required: true,
    },
    authorId: {
      type: Number,
      required: true,
    },
    thumbnail: {
      type: String, // Will store the base64 string of the image
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0, // Initialize with 0 views
    },
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", PostSchema);
