import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "../Controller/productController.js";
import { upload } from "../Middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", upload.single("productImage"), createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", upload.single("productImage"), updateProduct);
router.put("/:id/stock", updateProductStock);
router.delete("/:id", deleteProduct);

export default router;
