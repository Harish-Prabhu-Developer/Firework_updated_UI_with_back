import express from 'express';
import { upload } from '../Middleware/uploadMiddleware.js';
import {
  listAssets,
  uploadAsset,
  updateAsset,
  deleteAsset,
} from '../Controller/uploadController.js';

const uploadRoute = express.Router();

const uploadFields = upload.fields([
  { name: 'categoryImage', maxCount: 20 },
  { name: 'productImage', maxCount: 20 },
  { name: 'videoFile', maxCount: 20 },
]);

uploadRoute.get('/', listAssets);
uploadRoute.post('/:assetType', uploadFields, uploadAsset);
uploadRoute.put('/:assetType/:fileName', uploadFields, updateAsset);
uploadRoute.delete('/:assetType/:fileName', deleteAsset);

export default uploadRoute;
