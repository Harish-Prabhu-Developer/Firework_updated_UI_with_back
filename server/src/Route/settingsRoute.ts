import express from 'express';
import { getShopSettings, createOrUpdateSettings } from '../Controller/settingsController.js';

const settingsRoute = express.Router();

settingsRoute.get('/', getShopSettings);
settingsRoute.post('/', createOrUpdateSettings);
settingsRoute.put('/', createOrUpdateSettings);

export default settingsRoute;
