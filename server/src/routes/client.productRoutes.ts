import { Router, type Router as ExpressRouter } from "express";
import { getAllProducts, getFeaturedProducts } from "../controllers/client.productController.js";
import { getAllVideos } from "../controllers/client.videoController.js";
import { getPriceList } from "../controllers/client.priceListController.js";

const router: ExpressRouter = Router();

/**
 * Public routes for the client-facing website
 * No authentication required
 */
router.get("/products/featured", getFeaturedProducts);
router.get("/products", getAllProducts);
router.get("/videos", getAllVideos);
router.get("/price-list", getPriceList);

export default router;
