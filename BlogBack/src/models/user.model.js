import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    username: {
        type: String,
        default:null,
    },
    refreshToken:{
        type: String,
        default:null,
    }
},
{
    timestamps: true,
    versionKey:false
})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = function(password) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, this.password, (err, res) => {
            if (err) {
                return reject(err);
            }
            resolve(res); 
        });
    });
};

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
const UserModel =  mongoose.model("user",userSchema,"role")
export default UserModel;
