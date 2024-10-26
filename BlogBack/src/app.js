import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import {verifyJWT} from "./middlewares/auth.middleware.js"
import { ApiResponse } from "./utils/ApiResponse.js"
const app = express()

app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}))

app.use(express.json({limit:"10mb"}))//adding a .json that parses incoming requests with JSON payloads with a limit
app.use(express.urlencoded({extended:true, limit:"10mb"}))//parses incoming requests with urlencoded payloads
app.use(express.static("public"))
app.use(cookieParser())


//declaring routes
app.use("/user", userRouter);

app.get('/',verifyJWT,(req,res,next)=>{
    res.json(
        new ApiResponse(200,req.user,'Access Granted')
    )
})

app.get("/user/logout", (req, res) => {
    return res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(200)
        .json({ message: "Successfully logged out" });
});

export {app}
