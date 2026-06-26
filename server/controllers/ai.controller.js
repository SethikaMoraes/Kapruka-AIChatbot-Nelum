/**
 * Gemini AI controller
 */
import { geminiService } from '../services/gemini.service.js';

export const aiController = {
  async generateResponse(req, res, next) {
    const { prompt, systemInstruction } = req.body;
    try {
      const response = await geminiService.generateResponse(prompt, systemInstruction);
      res.json({ response });
    } catch (err) {
      next(err);
    }
  },

  async shoppingAdvice(req, res, next) {
    const { query, products } = req.body;
    try {
      const response = await geminiService.generateShoppingAdvice(query, products);
      res.json({ response });
    } catch (err) {
      next(err);
    }
  },

  async giftSuggestions(req, res, next) {
    const { occasion, budget, recipient, products } = req.body;
    try {
      const response = await geminiService.generateGiftSuggestions(occasion, budget, recipient, products);
      res.json({ response });
    } catch (err) {
      next(err);
    }
  },

  async upsellSuggestions(req, res, next) {
    const { cartItems, products } = req.body;
    try {
      const response = await geminiService.generateUpsellSuggestions(cartItems, products);
      res.json({ response });
    } catch (err) {
      next(err);
    }
  },

  async summarizeCart(req, res, next) {
    const { cartItems } = req.body;
    try {
      const response = await geminiService.summarizeCart(cartItems);
      res.json({ response });
    } catch (err) {
      next(err);
    }
  },

  async detectIntent(req, res, next) {
    const { userInput, context } = req.body;
    try {
      const response = await geminiService.detectIntentWithLLM(userInput, context);
      res.json({ response });
    } catch (err) {
      next(err);
    }
  },

  async analyzeTurn(req, res, next) {
    const { userInput, context } = req.body;
    try {
      const response = await geminiService.analyzeConversationTurn(userInput, context);
      res.json({ response });
    } catch (err) {
      next(err);
    }
  }
};

export default aiController;
