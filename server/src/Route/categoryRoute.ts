import express from 'express';
import { 
  createCategory, 
  getAllCategories, 
  getCategoryById, 
  updateCategory, 
  deleteCategory 
} from '../Controller/categoryController.js';
import { upload } from '../Middleware/uploadMiddleware.js';

const categoryRoute = express.Router();

categoryRoute.get('/', getAllCategories);
categoryRoute.get('/:id', getCategoryById);
categoryRoute.post('/', upload.single('categoryImage'), createCategory);
categoryRoute.put('/:id', upload.single('categoryImage'), updateCategory);
categoryRoute.delete('/:id', deleteCategory);

export default categoryRoute;
