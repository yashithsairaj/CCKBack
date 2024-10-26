import mongoose from "mongoose"

const VideoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
}, { timestamps: true }); 

export const Video = mongoose.model("Video", VideoSchema);