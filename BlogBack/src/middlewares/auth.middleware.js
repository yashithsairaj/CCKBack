import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import UserModel from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            return new ApiResponse(401, "Unauthorized request");
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedToken) => {
            if (err) if (err?.name === 'TokenExpiredError') {
                console.log('expired');
                return refreshAccessToken(req, res, next);
            } else return res.json(new ApiResponse(401, "Invaild token"));

            const user = await UserModel.findById(decodedToken?._id).select("-password -refreshToken")
            if (!user) return res.json(new ApiResponse(401, "User Not Found"));
            req.user = user;
            next();
        });

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

})

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    console.log('in rf');
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.header("refreshToken")

        if (!incomingRefreshToken) {
            return res.json(new ApiResponse(401, 'unauthorized request'));
        }


        console.log(incomingRefreshToken)

        jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decodedToken) => {
                if (err?.name === 'TokenExpiredError')
                    return res.json(new ApiResponse(401, 'Session Expired'))

                if (err) return res.json(new ApiResponse(401, 'Invalid refresh token'))

                generateAccessAndRefereshTokens(decodedToken?._id)
                    .then((object) => {
                        // console.log(accessToken);
                        console.log(object);
                        object.user = object.user.toObject() // convert mongoose object to a plain object
                        object.user.accessToken = object.accessToken;
                        object.user.refreshToken = object.newRefreshToken;
                        req.user = object.user;


                        const options = {
                            httpOnly: true,
                            secure: true
                        }
                        res.cookie("accessToken", object.accessToken, options)
                            .cookie("refreshToken", object.newRefreshToken, options)
                        next();
                    }
                    )
            }
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const generateAccessAndRefereshTokens = (_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await UserModel.findById({ _id }).select("-password");
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();
            if (!user) return res.json(new ApiResponse(401, "User Not Found"));

            const updatedUser = await UserModel.findByIdAndUpdate(
                user._id,
                {
                    $set: {
                        refreshToken: refreshToken,
                    },
                },
                { new: true }
            ).select("-password");
            console.log(accessToken);
            const object = { user: updatedUser, accessToken, refreshToken };
            resolve(object);
        } catch (error) {
            throw new ApiError(
                500,
                error,
                "Something went wrong while generating referesh and access token"
            );
        }
    });
};

export const verifyResetToken = asyncHandler(async (req, res, next) => {
    try {
        const token = req.params.token; // Token from the URL

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedToken) => {
            if (err?.name === 'TokenExpiredError') {
                return res.status(401).json({ message: "Token expired" });
            } else if (err) {
                return res.status(401).json({ message: "Invalid token" });
            }

            // Proceed if token is valid
            req.email = decodedToken.email; // Assuming the token contains the user's email
            next();
        });

    } catch (error) {
        res.status(401).json({ message: "Invalid access token" });
    }
});

