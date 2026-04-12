import express from 'express';
import authRoute from './authRoute.js';
import userRoute from './userRoute.js';
import categoryRoute from './categoryRoute.js';
import productRoute from './productRoute.js';
import videoRoute from './videoRoute.js';
import uploadRoute from './uploadRoute.js';
import invoiceRoute from './invoiceRoute.js';
import settingsRoute from './settingsRoute.js';
import orderRoute from './orderRoute.js';
import customerRoute from './customerRoute.js';
import tagRoute from './tagRoute.js';
import dashboardRoute from './dashboardRoute.js';
import voiceBillingRoutes from './voiceBillingRoutes.js';
import clientRoute from './clientRoute.js';
import uomRoute from './uomRoute.js';
import bannerRoute from './bannerRoute.js';
import { getActiveHeroSlides } from '../Controller/bannerController.js';

const Router = express.Router();

Router.use('/auth', authRoute);
Router.use('/users', userRoute);
Router.use('/category', categoryRoute);
Router.use('/product', productRoute);
Router.use('/video', videoRoute);
Router.use('/uploads', uploadRoute);
Router.use('/invoices', invoiceRoute);
Router.use('/settings', settingsRoute);
Router.use('/orders', orderRoute);
Router.use('/customers', customerRoute);
Router.use('/tag', tagRoute);
Router.use('/dashboard', dashboardRoute);
Router.use('/voice-billing', voiceBillingRoutes);
Router.use('/client', clientRoute);
Router.use('/uom', uomRoute);
Router.use('/banner', bannerRoute);
Router.get('/hero-slides', getActiveHeroSlides);


export default Router;
