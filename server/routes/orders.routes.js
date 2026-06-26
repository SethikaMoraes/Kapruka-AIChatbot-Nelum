/**
 * Orders routes
 */
import express from 'express';
import { ordersController } from '../controllers/orders.controller.js';
import { ordersValidator } from '../validators/orders.validator.js';

const router = express.Router();

router.post('/create', ordersValidator.validateCreate, ordersController.create);
router.post('/track', ordersValidator.validateTrack, ordersController.track);

export default router;
