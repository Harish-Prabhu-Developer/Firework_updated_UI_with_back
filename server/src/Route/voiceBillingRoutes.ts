import express from 'express';
import multer from 'multer';
import { processVoiceBilling, processAudioBilling } from '../Controller/voiceBillingController.js';

const upload = multer({ dest: 'uploads/temp_audio/' });
const Router = express.Router();

Router.post('/process', processVoiceBilling);
Router.post('/process-audio', upload.array('audio'), processAudioBilling);

export default Router;
