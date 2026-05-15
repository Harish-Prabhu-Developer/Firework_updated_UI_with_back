import { Router, type Router as ExpressRouter } from "express";
import { getAllProducts } from "../controllers/client.productController.js";

const router: ExpressRouter = Router();

/**
 * Public route for fetching the product catalog
 * No authentication required as this is for the client-side website
 */
router.get("/products", getAllProducts);

export default router;
