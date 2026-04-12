import { Request, Response } from "express";
import { db } from "../db/index.js";
import { videos } from "../db/schema/category.js";
import { eq, desc } from "drizzle-orm";
import fs from "fs";

export const createVideo = async (req: Request, res: Response) => {
  try {
    const { productId, name, type } = req.body;
    let url = req.body.url;

    const validTypes = ['upload', 'youtube'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, msg: "Invalid video type. Use 'upload' or 'youtube'." });
    }

    // If type is upload, url will be the file path if uploaded
    if (type === 'upload' && req.file) {
      url = req.file.path;
    }

    if (!url) {
      return res.status(400).json({ success: false, msg: "Video URL or file is required" });
    }

    const newVideo = await db.insert(videos).values({
      productId,
      name,
      type: type || 'upload',
      url,
    }).returning();

    res.status(201).json({
      success: true,
      data: newVideo[0],
      msg: "Video created successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const allVideos = await db.select().from(videos).orderBy(desc(videos.createdAt));
    res.status(200).json({ success: true, data: allVideos });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await db.select().from(videos).where(eq(videos.id, id as any));
    
    if (video.length === 0) {
      return res.status(404).json({ success: false, msg: "Video not found" });
    }

    res.status(200).json({ success: true, data: video[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { productId, name, type } = req.body;
    let url = req.body.url;

    const validTypes = ['upload', 'youtube'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, msg: "Invalid video type. Use 'upload' or 'youtube'." });
    }
    
    // Check if video exists
    const existingVideoArr = await db.select().from(videos).where(eq(videos.id, id as any));
    if (existingVideoArr.length === 0) {
      return res.status(404).json({ success: false, msg: "Video not found" });
    }

    const existingVideo = existingVideoArr[0];
    let finalUrl = url || existingVideo.url;

    if (type === 'upload' && req.file) {
      // Delete old file if it was an upload
      if (existingVideo.type === 'upload' && existingVideo.url && fs.existsSync(existingVideo.url)) {
        fs.unlinkSync(existingVideo.url);
      }
      finalUrl = req.file.path;
    }

    const updatedVideo = await db.update(videos)
      .set({
        productId,
        name,
        type,
        url: finalUrl,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, id as any))
      .returning();

    res.status(200).json({
      success: true,
      data: updatedVideo[0],
      msg: "Video updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deletedVideo = await db.delete(videos)
      .where(eq(videos.id, id as any))
      .returning();

    if (deletedVideo.length === 0) {
      return res.status(404).json({ success: false, msg: "Video not found" });
    }

    // Delete file if it was an upload
    if (deletedVideo[0].type === 'upload' && deletedVideo[0].url && fs.existsSync(deletedVideo[0].url)) {
      fs.unlinkSync(deletedVideo[0].url);
    }

    res.status(200).json({ success: true, msg: "Video deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, msg: error.message });
  }
};
