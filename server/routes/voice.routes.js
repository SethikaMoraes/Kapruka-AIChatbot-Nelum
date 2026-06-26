/**
 * Voice routes
 */
import express from 'express';
import { voiceController } from '../controllers/voice.controller.js';
import { voiceValidator } from '../validators/voice.validator.js';

const router = express.Router();

router.post('/synthesize', voiceValidator.validateSynthesize, voiceController.synthesize);

export default router;
