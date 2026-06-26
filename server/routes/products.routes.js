/**
 * Products routes
 */
import express from 'express';
import { productsController } from '../controllers/products.controller.js';
import { productsValidator } from '../validators/products.validator.js';

const router = express.Router();

router.post('/search', productsValidator.validateSearch, productsController.search);
router.post('/details', productsValidator.validateDetails, productsController.details);
router.get('/', productsController.categories);

export default router;
