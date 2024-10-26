import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createVideo = asyncHandler(async (req, res) => {
    try {
        const { title, videoFile, thumbnail } = req.body;

        const newVideo = new Video({
            title,
            videoFile,
            thumbnail
        });

        const savedVideo = await newVideo.save();
        
        res.status(201).json({
            id: savedVideo._id,
            title: savedVideo.title,
            videoFile: savedVideo.videoFile,
            thumbnail: savedVideo.thumbnail,
            createdAt: savedVideo.createdAt
        });

    } catch (error) {
        res.status(500).json({ message: 'Error creating video', error });
    }
});


const deleteVideo = async (req, res) => {
    try {
        await Video.findByIdAndDelete(req.params.id);
        res.status(200)
        .json({ message: "Video deleted successfully" });
    } catch (error) {
        res.status(500)
        .json({ error: "Error deleting video" });
    }
}

const fetchVideo = asyncHandler( async (req, res) => {
    try {
        const video = await Video.findById(req.query._id);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.status(200).json({
            id: video._id,
            title: video.title,
            videoFile: video.videoFile,
            thumbnail: video.thumbnail,
            createdAt: video.createdAt
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });

    }
})

const fetchAllVideo = asyncHandler(async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
  
      if (!page) {
        return res.status(404).json({ message: "page not defined" });
      }
  
      const startIndex = (page - 1) * limit;
      const totalVideo = await Video.countDocuments();
  
      const video = await Video.find().skip(startIndex).limit(limit);
  
      res.status(200).json({
        totalVideo: totalVideo,
        currentPage: page,
        totalPages: Math.ceil(totalVideo / limit),
        video: video,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  });



export {createVideo, fetchVideo, deleteVideo, fetchAllVideo}