import express from "express";
import {
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "../Controller/videoController.js";
import { upload } from "../Middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", upload.single("videoFile"), createVideo);
router.get("/", getAllVideos);
router.get("/:id", getVideoById);
router.put("/:id", upload.single("videoFile"), updateVideo);
router.delete("/:id", deleteVideo);

export default router;
