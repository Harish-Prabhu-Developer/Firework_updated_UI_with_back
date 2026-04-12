import { Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import fs from "fs";

import { db } from "../db/index.js";
import { banners } from "../db/schema/category.js";

const ALLOWED_BADGE_ICONS = ["sparkles", "zap", "flower2", "flame"] as const;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const normalizeBoolean = (value: unknown) => value === "true" || value === true;

const normalizeImagePath = (imagePath: string | null) => {
  if (!imagePath) return null;
  return imagePath.replace(/\\/g, "/");
};

const formatBanner = (banner: typeof banners.$inferSelect) => ({
  id: banner.id,
  image: normalizeImagePath(banner.image) ?? "",
  badgeIcon: banner.badgeIcon,
  badge: banner.badge,
  title: banner.title,
  desc: banner.desc,
  cta: banner.cta,
  link: banner.link,
  status: banner.status,
  displayOrder: banner.displayOrder,
  createdAt: banner.createdAt,
  updatedAt: banner.updatedAt,
});

const cleanupUploadedFile = (filePath?: string) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const validateBannerInput = (
  body: Request["body"],
  imageRequired: boolean,
  file?: Express.Multer.File,
) => {
  const title = String(body.title ?? "").trim();
  const badge = String(body.badge ?? "").trim();
  const badgeIcon = String(body.badgeIcon ?? "").trim().toLowerCase();
  const descText = String(body.desc ?? "").trim();
  const cta = String(body.cta ?? "").trim();
  const link = String(body.link ?? "").trim();
  const displayOrder = Number.parseInt(String(body.displayOrder ?? "1"), 10);
  const status = body.status !== undefined ? normalizeBoolean(body.status) : true;

  if (imageRequired && !file) {
    return { error: "Banner image is required" };
  }

  if (!title) return { error: "Title is required" };
  if (!badge) return { error: "Badge text is required" };
  if (!descText) return { error: "Description is required" };
  if (!cta) return { error: "CTA text is required" };
  if (!link) return { error: "Button link is required" };
  if (!link.startsWith("/")) return { error: "Link must start with /" };
  if (!ALLOWED_BADGE_ICONS.includes(badgeIcon as (typeof ALLOWED_BADGE_ICONS)[number])) {
    return { error: "Badge icon must be one of: sparkles, zap, flower2, flame" };
  }
  if (badge.length > 120) return { error: "Badge text must be 120 characters or less" };
  if (title.length > 60) return { error: "Title must be 60 characters or less" };
  if (descText.length > 200) return { error: "Description must be 200 characters or less" };
  if (cta.length > 30) return { error: "CTA text must be 30 characters or less" };
  if (Number.isNaN(displayOrder) || displayOrder < 1) {
    return { error: "Display order must be a number greater than or equal to 1" };
  }

  if (file) {
    const mimeType = String(file.mimetype ?? "").toLowerCase();
    if (!["image/jpeg", "image/jpg", "image/webp"].includes(mimeType)) {
      return { error: "Image must be JPG or WebP format" };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { error: "Image size must be 2MB or less" };
    }
  }

  return {
    value: {
      title,
      badge,
      badgeIcon,
      desc: descText,
      cta,
      link,
      displayOrder,
      status,
    },
  };
};

export const createBanner = async (req: Request, res: Response) => {
  try {
    const validation = validateBannerInput(req.body, true, req.file);
    if ("error" in validation) {
      cleanupUploadedFile(req.file?.path);
      return res.status(400).json({ success: false, message: validation.error });
    }

    const image = normalizeImagePath(req.file?.path ?? null);
    const newBanner = await db
      .insert(banners)
      .values({
        ...validation.value,
        image: image ?? "",
      })
      .returning();

    res.status(201).json({
      success: true,
      data: formatBanner(newBanner[0]),
      message: "Hero slide created successfully",
    });
  } catch (error: any) {
    cleanupUploadedFile(req.file?.path);
    console.error("Error in createBanner:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBanners = async (_req: Request, res: Response) => {
  try {
    const allBanners = await db
      .select()
      .from(banners)
      .orderBy(banners.displayOrder, desc(banners.createdAt));

    res.status(200).json({
      success: true,
      data: allBanners.map(formatBanner),
    });
  } catch (error: any) {
    console.error("Error in getAllBanners:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBannerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const banner = await db.select().from(banners).where(eq(banners.id, id as any));

    if (banner.length === 0) {
      return res.status(404).json({ success: false, message: "Hero slide not found" });
    }

    res.status(200).json({ success: true, data: formatBanner(banner[0]) });
  } catch (error: any) {
    console.error("Error in getBannerById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingBannerArr = await db.select().from(banners).where(eq(banners.id, id as any));

    if (existingBannerArr.length === 0) {
      cleanupUploadedFile(req.file?.path);
      return res.status(404).json({ success: false, message: "Hero slide not found" });
    }

    const validation = validateBannerInput(req.body, false, req.file);
    if ("error" in validation) {
      cleanupUploadedFile(req.file?.path);
      return res.status(400).json({ success: false, message: validation.error });
    }

    const existingBanner = existingBannerArr[0];
    let image = existingBanner.image;

    if (req.file) {
      cleanupUploadedFile(existingBanner.image);
      image = normalizeImagePath(req.file.path) ?? existingBanner.image;
    }

    const updatedBanner = await db
      .update(banners)
      .set({
        ...validation.value,
        image,
        updatedAt: new Date(),
      })
      .where(eq(banners.id, id as any))
      .returning();

    res.status(200).json({
      success: true,
      data: formatBanner(updatedBanner[0]),
      message: "Hero slide updated successfully",
    });
  } catch (error: any) {
    cleanupUploadedFile(req.file?.path);
    console.error("Error in updateBanner:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedBanner = await db
      .delete(banners)
      .where(eq(banners.id, id as any))
      .returning();

    if (deletedBanner.length === 0) {
      return res.status(404).json({ success: false, message: "Hero slide not found" });
    }

    cleanupUploadedFile(deletedBanner[0].image);

    res.status(200).json({ success: true, message: "Hero slide deleted successfully" });
  } catch (error: any) {
    console.error("Error in deleteBanner:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveHeroSlides = async (_req: Request, res: Response) => {
  try {
    const activeSlides = await db
      .select()
      .from(banners)
      .where(and(eq(banners.status, true)))
      .orderBy(banners.displayOrder, desc(banners.createdAt));

    res.status(200).json(activeSlides.map((slide) => ({
      image: normalizeImagePath(slide.image) ?? "",
      badgeIcon: slide.badgeIcon,
      badge: slide.badge,
      title: slide.title,
      desc: slide.desc,
      cta: slide.cta,
      link: slide.link,
    })));
  } catch (error: any) {
    console.error("Error in getActiveHeroSlides:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
