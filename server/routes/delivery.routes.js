/**
 * Delivery routes
 */
import express from 'express';
import { deliveryController } from '../controllers/delivery.controller.js';
import { deliveryValidator } from '../validators/delivery.validator.js';

const router = express.Router();

router.get('/cities', deliveryController.listCities);
router.post('/check', deliveryValidator.validateCheck, deliveryController.check);

export default router;
