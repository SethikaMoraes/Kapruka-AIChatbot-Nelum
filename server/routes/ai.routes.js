/**
 * AI proxy routes
 */
import express from 'express';
import { aiController } from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/generate-response', aiController.generateResponse);
router.post('/shopping-advice', aiController.shoppingAdvice);
router.post('/gift-suggestions', aiController.giftSuggestions);
router.post('/upsell-suggestions', aiController.upsellSuggestions);
router.post('/summarize-cart', aiController.summarizeCart);
router.post('/detect-intent', aiController.detectIntent);
router.post('/analyze-turn', aiController.analyzeTurn);

export default router;
