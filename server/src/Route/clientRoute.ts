import express from "express";
import { getProductsByCategory, getProductsByTags } from "../Controller/client.productController.js";

const router = express.Router();

router.get("/products", getProductsByCategory);
router.get("/products-by-tags", getProductsByTags);

export default router;
