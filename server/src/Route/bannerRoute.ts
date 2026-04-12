import express from 'express';
import { 
  createBanner, 
  getActiveHeroSlides,
  getAllBanners, 
  getBannerById, 
  updateBanner, 
  deleteBanner 
} from '../Controller/bannerController.js';
import { upload } from '../Middleware/uploadMiddleware.js';

const bannerRoute = express.Router();

bannerRoute.get('/active', getActiveHeroSlides);
bannerRoute.get('/', getAllBanners);
bannerRoute.get('/:id', getBannerById);
bannerRoute.post('/', upload.single('bannerImage'), createBanner);
bannerRoute.put('/:id', upload.single('bannerImage'), updateBanner);
bannerRoute.delete('/:id', deleteBanner);

export default bannerRoute;
