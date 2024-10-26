import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import UserModel from "../models/user.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { log } from "console";

const generateAccessAndRefereshTokens = async (existedUser) => {
  try {
    const accessToken = existedUser.generateAccessToken();
    const refreshToken = existedUser.generateRefreshToken();
    const updatedUser = await UserModel.findByIdAndUpdate(
      { _id: existedUser._id },
      {
        $set: {
          refreshToken: refreshToken,
        },
      }
    ).select("-password");
    return { user: updatedUser, accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const signUp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // console.log(req.body)
  if ([name, email, password].some((field) => field?.trim() === "")) {
    return res.json(new ApiResponse(400, "All fields are required"));
  }
  if (!/^[a-zA-Z ]*$/.test(name)) {
    return res.json(new ApiResponse(400, "Invalid Name Entered"));
  }
  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return res.json(new ApiResponse(400, "Invalid email Entered"));
  }
  if (password.length < 8) {
    return res.json(new ApiResponse(400, "Password too short"));
  }

  const existedUser = await UserModel.findOne({ email });

  if (existedUser)
    return res.json(new ApiResponse(400, "email already exists"));

  const newUser = new UserModel({
    username: name,
    email,
    password,
  });
  newUser
    .save()
    .then((result) => {
      res.json(new ApiResponse(201, result, "signup successfull"));
    })
    .catch((err) => {
      throw new ApiError(
        400,
        `an error occured while saving the account: ${err}`
      );
    });
});

const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ([email, password].some((field) => field?.trim() === "")) {
    return res.json(new ApiResponse(400, "All fields are required"));
  }
  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return res.json(new ApiResponse(400, "Invalid email Entered"));
  }
  if (password.length < 8) {
    return res.json(new ApiResponse(400, "Password too short"));
  }
  const existedUser = await UserModel.findOne({ email });
  if (!existedUser) {
    return res.json(new ApiResponse(400, "Invalid Email/Password"));
  }
  try {
    existedUser.isPasswordCorrect(password).then(async (isMatched) => {
      if (!isMatched) {
        return res.json(new ApiResponse(400, "Invalid Email/Password"));
      }
      const { user, accessToken, refreshToken } =
        await generateAccessAndRefereshTokens(existedUser);
      const options = {
        httpOnly: false,
        secure: true,
      };

      // Check if the user is an admin
      if (email === "admin@example.com") {
        // Navigate to admin panel
        return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
            new ApiResponse(
              200,
              { user, accessToken, refreshToken, redirect: "/admin/dashboard" },
              "Admin logged in successfully"
            )
          );
      } else {
        // Normal user login
        return res
          .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
            new ApiResponse(
              200,
              { user, accessToken, refreshToken, redirect: "/home" },
              "User logged in successfully"
            )
          );
      }
    });
  } catch (err) {
    return new ApiError(500, "Internal Server ERROR");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req.query);

  await UserModel.findByIdAndUpdate(req.query._id, {
    $unset: {
      refreshToken: 1, // this removes the field from document
    },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };
  console.log(req.query);
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const changeCurrentPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await UserModel.findById(req.user?._id);
  if (!user) {
    return res.json(new ApiResponse(404, {}, "User not found"));
  }

  user.isPasswordCorrect(oldPassword).then((isPasswordCorrect) => {
    if (!isPasswordCorrect) {
      res.json(400, {}, "Invalid old password");
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  });
};

const getCurrentUser = async (req, res) => {
  const userId = req.user._id;
  const user = await UserModel.findById(userId).select("-password");
  return res.json(new ApiResponse(200, user, "User fetched successfully"));
};

const updateUserDetails = async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await UserModel.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res.json(
    new ApiResponse(200, user, "Account details updated successfully")
  );
};

const generateResetToken = (email) => {
  console.log("generateResetToken email:", email);
  return jwt.sign(
    { email }, // Payload
    process.env.ACCESS_TOKEN_SECRET, // Secret key
    { expiresIn: "1h" } // Token expiration time
  );
};

const sendResetEmail = async (email, resetToken) => {
  console.log("sendResetEmail reset token:", resetToken);
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "abhinavramesh02@gmail.com",
      pass: "pfit ntrm tcbm tsxe",
    },
  });
  const mailOptions = {
    from: "abhinavramesh02@gmail.com",
    to: email,
    subject: "Password Reset",
    text: `You are receiving this because you have requested a password reset. Click the link below to reset your password: ${resetUrl}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Reset email sent successfully");
  } catch (error) {
    console.error("Error sending email", error);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }
  console.log("back forgot passwor email:", email);
  const resetToken = generateResetToken(email);
  console.log("back forgot password reset token", resetToken);

  try {
    await sendResetEmail(email, resetToken);
    res.status(200).json({ success: true, message: "Password reset email sent!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error sending email" });
  }
};

const resetPasswordToken = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: "Token is required" });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("resetPasswordToken decoded token:", decoded);
    const email = decoded.email;
    console.log("resetPasswordToken email:", email);

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await UserModel.findOneAndUpdate(
      { email: email },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "Password has been reset!" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }

    console.error("JWT Error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export {
  signUp,
  signIn,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  resetPasswordToken,
  forgotPassword,
};
