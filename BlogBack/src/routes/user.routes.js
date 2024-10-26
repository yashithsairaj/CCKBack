import { Router } from "express";
import {
  signUp,
  signIn,
  changeCurrentPassword,
  getCurrentUser,
  resetPasswordToken,
  forgotPassword,
  logoutUser,
  updateUserDetails,
} from "../controllers/user.controller.js";
import {
  createPost,
  fetchPost,
  deletePost,
  updatePost,
  fetchAllPost,
  searchPost,
  fetchPostsByCategory,
  fetchTrendingPosts,
  fetchTrendingCategories,
  incrementCategoryClick,
  checkDuplicates,
} from "../controllers/post.controller.js";
import {
  checkCategoryDuplicates,
  createCategory,
  deleteCategory,
  fetchAllCategories,
  fetchCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import { verifyJWT, verifyResetToken } from "../middlewares/auth.middleware.js";
import {
  createVideo,
  deleteVideo,
  fetchAllVideo,
  fetchVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/signup").post(signUp);

router.route("/signin").post(signIn);

router.route("/logout").get(verifyJWT,logoutUser);

router.route("/forgot-password").post(forgotPassword);

router.route("/reset-password/:token").post(resetPasswordToken);

router.route("/getcurrentuser").get(verifyJWT, getCurrentUser);

router.route("/updateuserdetails").put(verifyJWT, updateUserDetails);

router.route("/changepass").put(verifyJWT, changeCurrentPassword);



router.route("/createpost").post(createPost);

router.route("/deletepost/:id").delete(deletePost);

router.route("/fetchpost").get(fetchPost);

router.route("/updatepost").put(updatePost);

router.route("/fetchallpost").get(fetchAllPost);

router.route("/searchpost").get( searchPost);
// Add route to fetch posts by category
router.route("/fetchpostsbycategory").get(fetchPostsByCategory);

router.route("/trendingposts").get(fetchTrendingPosts);

router.route("/trendingcategories").get(fetchTrendingCategories);
// Add the route
router.route("/categories/:categoryId/click").put(incrementCategoryClick);

router.route("/checktitle").get(checkDuplicates);



router.route("/createcategory").post( createCategory);

router.route("/deletecategory").delete(verifyJWT, deleteCategory);

router.route("/fetchcategory").get(verifyJWT, fetchCategory);

router.route("/updatecategory").put(verifyJWT, updateCategory);

router.route("/fetchallcategory").get(fetchAllCategories);

router.route("/checkcategory").get(checkCategoryDuplicates);



router.route("/createvideo").post(createVideo);

router.route("/deletevideo/:id").delete(deleteVideo);

router.route("/fetchvideo").get(fetchVideo);

router.route("/fetchallvideo").get(fetchAllVideo);

export default router;
