import express from "express";
import {
  createTag,
  getAllTags,
  getTagById,
  updateTag,
  deleteTag,
} from "../Controller/tagController.js";
import { authenticate } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, createTag);
router.get("/", getAllTags);
router.get("/:id", getTagById);
router.put("/:id", authenticate, updateTag);
router.delete("/:id", authenticate, deleteTag);

export default router;
