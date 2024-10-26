import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    clickCount: { type: Number, default: 0 },
    categoryId: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", CategorySchema);
